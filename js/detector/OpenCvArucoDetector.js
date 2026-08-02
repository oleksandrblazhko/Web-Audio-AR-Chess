import { MarkerDetection } from "../models/MarkerDetection.js";

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


/*
        console.log(
            "corners:",
            corners.size()
        );

        console.log(
            "ids rows:",
            ids.rows
        );


        if (ids.rows > 0) {

            console.log(
                "ids:",
                ids.data
            );

        }
*/

        // ----------------------------------------
        // Memory cleanup
        // ----------------------------------------

        gray.delete();

        return new MarkerDetection(
            corners,
            ids
        );

    }


}

