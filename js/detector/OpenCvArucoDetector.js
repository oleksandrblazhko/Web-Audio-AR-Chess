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
                
                // The center is calculated here in pixels for use when correction is not available
                marker.center = marker.calculateCenter();
                markerList.push(marker);
            }
        }
        
        // --- Perspective Correction Step ---
        if (calibration && 
            calibration.image_to_board_matrix && !calibration.image_to_board_matrix.empty() &&
            calibration.board_to_image_matrix && !calibration.board_to_image_matrix.empty()
            ) {
            
            const boardDimensions = Config.boardDimensions;
            const boardCenter = new Point(boardDimensions / 2, boardDimensions / 2);

            // Ensure matrices are 32F for the perspectiveTransform function
            const image_to_board_32f = new this.cv.Mat();
            const board_to_image_32f = new this.cv.Mat();
            calibration.image_to_board_matrix.convertTo(image_to_board_32f, this.cv.CV_32F);
            calibration.board_to_image_matrix.convertTo(board_to_image_32f, this.cv.CV_32F);

            this.perspectiveCorrector.correct(
                markerList,
                boardCenter,
                Config.cameraHeightCali,
                Config.markerSize,
                boardDimensions,
                image_to_board_32f,
                board_to_image_32f
            );

            // Cleanup
            image_to_board_32f.delete();
            board_to_image_32f.delete();
        }

        gray.delete();
        corners.delete();
        ids.delete();
        rejected.delete();

        return markerList;
    }
}
