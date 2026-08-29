export class OpenCvLoader {

    static async waitForOpenCV() {

        console.log(
            "window.cv:",
            window.cv
        );

        console.log(
            "Promise:",
            window.cv instanceof Promise
        );

        if (!window.cv) {

            throw new Error(
                "OpenCV is not loaded."
            );

        }

        const cv =
            window.cv instanceof Promise
                ? await window.cv
                : window.cv;

        console.log(
            "OpenCV initialized"
        );

        console.log(
            "Mat:",
            cv.Mat
        );

        console.log(
            "Aruco:",
            cv.aruco_ArucoDetector
        );

        return cv;

    }

}
