export class OpenCvLoader {

    static waitForOpenCV() {

        return new Promise((resolve) => {


            if (window.cv && window.cv.Mat) {

                console.log(
                    "OpenCV ready immediately"
                );

                resolve(window.cv);

                return;

            }


            window.Module = window.Module || {};

            window.Module.onRuntimeInitialized = () => {

                console.log(
                    "OpenCV ready from Module"
                );

                resolve(window.cv);

            };


        });

    }

}
