import { CameraCalibrator } from "./CameraCalibrator.js";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const logElement = document.getElementById("log");
const saveButton = document.getElementById("saveButton");

function log(text) {

    console.clear();
    console.log(text);

    logElement.textContent = text;

}

async function startCamera() {

    const stream = await navigator.mediaDevices.getUserMedia({

        video: {

            facingMode: "environment",

            width: 640,

            height: 480

        },

        audio: false

    });

    video.srcObject = stream;

    await video.play();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

}

function waitOpenCv() {

    return new Promise(resolve => {

        if (cv instanceof Promise) {

            cv.then(realCv => {

                window.cv = realCv;
                resolve(realCv);

            });

        }
        else if (cv.getBuildInformation === undefined) {

            cv.onRuntimeInitialized = () => {

                resolve(cv);

            };

        }
        else {

            resolve(cv);

        }

    });

}

(async function () {

    const cv = await waitOpenCv();

    await startCamera();

    const config = {

        topLeftId: 467,

        topRightId: 163,

        bottomRightId: 112,

        bottomLeftId: 946,

        boardSize: 360,

        cameraHeight: 450,

        markerSize: 9

    };

    const calibrator =
        new CameraCalibrator(
            cv,
            config
        );

    let frame = null;

    function loop() {

        ctx.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        if (frame) {
            frame.delete();
        }


        frame = cv.imread(canvas);


        let result = null;

        try {

            result =
                calibrator.calibrate(frame);

        }
        catch(e) {

            console.error(
                "Calibration error:",
                e
            );

        }


        if (result == null) {

            log(
                "Waiting for four board markers..."
            );

        }
        else {

            let text = "";

            for (const m of result) {

                text +=
                    "ID " +
                    m.id +
                    " : (" +
                    m.center.x.toFixed(1) +
                    ", " +
                    m.center.y.toFixed(1) +
                    ")\n";

            }

            log(text);

        }


        requestAnimationFrame(loop);

    }

    loop();

    saveButton.onclick = () => {

        const camera = calibrator.cameraParameters;

        if (!camera) {

            alert("Calibration not completed.");

            return;

        }

        const blob = new Blob(

            [

                JSON.stringify(
                    camera,
                    null,
                    4
                )

            ],

            {

                type: "application/json"

            }

        );

        const url =
            URL.createObjectURL(blob);

        const a =
            document.createElement("a");

        a.href = url;

        a.download = "camera.json";

        a.click();

        URL.revokeObjectURL(url);

    };

})();
