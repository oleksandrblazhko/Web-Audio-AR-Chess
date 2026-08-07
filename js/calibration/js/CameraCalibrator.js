export class CameraCalibrator {

    constructor(cv, config) {

        this.cv = cv;
        this.config = config;


        this.dictionary =
            cv.getPredefinedDictionary(
                cv.aruco_PredefinedDictionaryType.DICT_4X4_1000
            );


        this.parameters =
            new cv.aruco_DetectorParameters();

        this.refineParameters =
            new cv.aruco_RefineParameters(
                0,
                0,
                false
            );


        this.detector =
            new cv.aruco_ArucoDetector(
                this.dictionary,
                this.parameters,
                this.refineParameters
            );

    }

    calibrate(image) {


        console.log("1");


        const corners =
            new this.cv.MatVector();


        const ids =
            new this.cv.Mat();


        const rejected =
            new this.cv.MatVector();



        console.log(
            "image:",
            image.rows,
            image.cols,
            image.type()
        );



        const gray =
            new this.cv.Mat();

        this.cv.cvtColor(
            image,
            gray,
            this.cv.COLOR_RGBA2GRAY
        );


        console.log(
            "gray:",
            gray.rows,
            gray.cols,
            gray.type()
        );


        this.detector.detectMarkers(
            gray,
            corners,
            ids,
            rejected
        );


        gray.delete();



        console.log(
            "AFTER DETECT",
            "ids rows:",
            ids.rows,
            "corners:",
            corners.size(),
            "rejected:",
            rejected.size()
        );


        console.log(
            "Detected:",
            ids.rows,
            "ids,",
            corners.size(),
            "corner sets"
        );


        if(
            ids.rows === 0 ||
            corners.size() === 0 ||
            ids.rows !== corners.size()
        ){

            console.log(
                "Invalid detection result"
            );

            corners.delete();
            ids.delete();
            rejected.delete();

            return null;
        }

        for(
            let i = 0;
            i < ids.rows && i < corners.size();
            i++
        ){

            console.log(
                "ID",
                ids.intAt(i,0)
            );


            console.log(
                "corner exists:",
                i < corners.size()
            );


            if(i < corners.size()){

                const pts =
                    corners.get(i);


                console.log(
                    "points:",
                    pts.rows,
                    pts.cols
                );


                console.log(
                    pts.data32F
                );


                pts.delete();

            }

        }



        corners.delete();
        ids.delete();
        rejected.delete();



        return null;

    }

}
