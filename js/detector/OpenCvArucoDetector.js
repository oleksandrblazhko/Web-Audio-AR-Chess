import { Marker } from "../models/Marker.js";
import { Point } from "../models/Point.js";
import { PerspectiveCorrector } from "./PerspectiveCorrector.js";
import { Config } from "../config/config.js";

export class OpenCvArucoDetector {
    constructor(cv) {
        this.cv = cv;

        const dictionary = this.cv.getPredefinedDictionary(this.cv.DICT_4X4_1000);
        const parameters = new this.cv.aruco_DetectorParameters();
        const refineParameters = new this.cv.aruco_RefineParameters(10.0, 3.0, false);

        this.detector = new this.cv.aruco_ArucoDetector(
            dictionary,
            parameters,
            refineParameters
        );
        
        this.perspectiveCorrector = new PerspectiveCorrector(cv);
    }

    detect(frame, calibration) {
        let gray = new this.cv.Mat();
        this.cv.cvtColor(frame, gray, this.cv.COLOR_RGBA2GRAY);

        const corners = new this.cv.MatVector();
        const ids = new this.cv.Mat();
        const rejected = new this.cv.MatVector();

        this.detector.detectMarkers(gray, corners, ids, rejected);

        const markerList = [];
        if (ids.rows > 0) {
            for (let i = 0; i < ids.rows; i++) {
                const id = ids.data32S ? ids.data32S[i] : ids.data[i];
                const marker = new Marker(id);
                const cornerMat = corners.get(i);
                
                marker.addCorner(cornerMat.data32F[0], cornerMat.data32F[1]);
                marker.addCorner(cornerMat.data32F[2], cornerMat.data32F[3]);
                marker.addCorner(cornerMat.data32F[4], cornerMat.data32F[5]);
                marker.addCorner(cornerMat.data32F[6], cornerMat.data32F[7]);
                
                markerList.push(marker);
            }
        }
        
        // --- Perspective Correction Step ---
        if (calibration && calibration.image_to_board_matrix && !calibration.image_to_board_matrix.empty()) {
            const boardDimensions = Config.boardDimensions; // e.g., 360mm
            const boardCenter = new Point(boardDimensions / 2, boardDimensions / 2);
            const gridToMmScale = boardDimensions / 8.0;

            // Create a scaling matrix to convert from 8x8 grid to mm
            const scaleMatrix = this.cv.matFromArray(3, 3, this.cv.CV_64F, [
                gridToMmScale, 0, 0,
                0, gridToMmScale, 0,
                0, 0, 1
            ]);

            const mmHomography = new this.cv.Mat();
            const emptyMat = new this.cv.Mat(); // Matrix for gemm, prevent memory leak

            // Create the final homography: image -> board (mm)
            // mmHomography = scaleMatrix * image_to_board_matrix
            this.cv.gemm(scaleMatrix, calibration.image_to_board_matrix, 1, emptyMat, 0, mmHomography, 0);

            // Convert the 64F homography matrix to 32F for perspectiveTransform
            const mmHomography32F = new this.cv.Mat();
            mmHomography.convertTo(mmHomography32F, this.cv.CV_32F);

            this.perspectiveCorrector.correct(
                markerList,
                boardCenter,
                Config.cameraHeightCali,
                Config.markerSize,
                mmHomography32F // Pass the 32F version
            );
            
            // Memory cleanup for matrices created in this block
            scaleMatrix.delete();
            mmHomography.delete();
            mmHomography32F.delete();
            emptyMat.delete();
        }

        gray.delete();
        corners.delete();
        ids.delete();
        rejected.delete();

        return markerList;
    }
}
