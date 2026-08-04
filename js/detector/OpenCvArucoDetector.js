import { Marker } from "../models/Marker.js";

export class OpenCvArucoDetector {


    constructor(cv) {

        this.cv = cv;


        const dictionary =
            this.cv.getPredefinedDictionary(
                this.cv.DICT_4X4_1000
            );


        const parameters =
            new this.cv.aruco_DetectorParameters();


        const refineParameters =
            new this.cv.aruco_RefineParameters(
                10.0,
                3.0,
                false
            );


        this.detector =
            new this.cv.aruco_ArucoDetector(
                dictionary,
                parameters,
                refineParameters
            );


    }


    detect(frame) {


        let gray =
            new this.cv.Mat();


        // ----------------------------------------
        // RGBA -> GRAY
        // ----------------------------------------

        this.cv.cvtColor(
            frame,
            gray,
            this.cv.COLOR_RGBA2GRAY
        );


        const corners =
            new this.cv.MatVector();


        const ids =
            new this.cv.Mat();


        const rejected =
            new this.cv.MatVector();



        // ----------------------------------------
        // ArUco detection
        // ----------------------------------------

        this.detector.detectMarkers(
            gray,
            corners,
            ids,
            rejected
        );


        const markerList = [];

        if (ids.rows > 0) {
            for (let i = 0; i < ids.rows; i++) {
                // Отримуємо ID (іноді ids.data32S використовується для цілих чисел в OpenCV.js)
                const id = ids.data32S ? ids.data32S[i] : ids.data[i];
                const marker = new Marker(id);
                const cornerMat = corners.get(i);
                
                // cornerMat містить 8 значень: x0, y0, x1, y1, x2, y2, x3, y3
                marker.addCorner(cornerMat.data32F[0], cornerMat.data32F[1]);
                marker.addCorner(cornerMat.data32F[2], cornerMat.data32F[3]);
                marker.addCorner(cornerMat.data32F[4], cornerMat.data32F[5]);
                marker.addCorner(cornerMat.data32F[6], cornerMat.data32F[7]);
                
                markerList.push(marker);
            }
        }


        // ----------------------------------------
        // Memory cleanup
        // ----------------------------------------

        gray.delete();
        corners.delete();
        ids.delete();
        rejected.delete();

        return markerList;

    }


}
