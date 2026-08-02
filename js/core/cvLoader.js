export class CvLoader {

    static async load() {

        return new Promise((resolve, reject) => {

            if (typeof cv === "undefined") {

                reject("OpenCV.js не завантажений");
                return;

            }

            if (cv.getBuildInformation) {

                resolve();

                return;

            }

            cv.onRuntimeInitialized = () => {

                resolve();

            };

        });

    }

}

