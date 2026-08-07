async function waitOpenCV() {

    return new Promise(resolve => {

        if (cv instanceof Promise) {

            cv.then(realCv => {

                window.cv = realCv;
                resolve(realCv);

            });

        } else if (cv.getBuildInformation === undefined) {

            cv.onRuntimeInitialized = () => resolve(cv);

        } else {

            resolve(cv);

        }

    });

}

(async () => {

    const cv = await waitOpenCV();

    console.log(cv.getBuildInformation());

    const canvas =
        document.getElementById("canvas");

    // --------------------------------------------------
    // Dictionary
    // --------------------------------------------------

    const dictionary =
        cv.getPredefinedDictionary(
            cv.DICT_4X4_50
        );

    // --------------------------------------------------
    // Detector
    // --------------------------------------------------

    const detectorParameters =
        new cv.aruco_DetectorParameters();

    const refineParameters =
        new cv.aruco_RefineParameters(
            10,
            3,
            true
        );

    const detector =
        new cv.aruco_ArucoDetector(
            dictionary,
            detectorParameters,
            refineParameters
        );

    // --------------------------------------------------
    // Generate marker
    // --------------------------------------------------

    const marker =
        new cv.Mat();

    dictionary.generateImageMarker(
        10,
        300,
        marker
    );

    canvas.width = 300;
    canvas.height = 300;

    cv.imshow(
        canvas,
        marker
    );

    console.log("Marker generated.");

    // --------------------------------------------------
    // Detect
    // --------------------------------------------------

    const corners =
        new cv.MatVector();

    const ids =
        new cv.Mat();

    const rejected =
        new cv.MatVector();

    try {

        detector.detectMarkers(
            marker,
            corners,
            ids,
            rejected
        );

        console.log("========== RESULT ==========");

        console.log(
            "ids.rows =",
            ids.rows
        );

        console.log(
            "ids.cols =",
            ids.cols
        );

        console.log(
            "ids.total() =",
            ids.total()
        );

        console.log(
            "ids.empty() =",
            ids.empty()
        );

        console.log(
            "ids.type() =",
            ids.type()
        );

        console.log(
            "corners.size() =",
            corners.size()
        );

        console.log(
            "rejected.size() =",
            rejected.size()
        );

        console.log(
            "ids.data32S =",
            ids.data32S
        );

        if (corners.size() > 0) {

            const pts =
                corners.get(0);

            console.log(
                "corner rows =",
                pts.rows
            );

            console.log(
                "corner cols =",
                pts.cols
            );

            console.log(
                "corner type =",
                pts.type()
            );

            console.log(
                "corner data =",
                pts.data32F
            );

            pts.delete();

        }

    }
    catch (e) {

        console.error(e);

    }

    // --------------------------------------------------
    // Cleanup
    // --------------------------------------------------

    marker.delete();
    corners.delete();
    ids.delete();
    rejected.delete();

    detector.delete();
    detectorParameters.delete();
    refineParameters.delete();
    dictionary.delete();

})();

