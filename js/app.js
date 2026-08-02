import { CameraManager } from "./camera/CameraManager.js";
import { Renderer } from "./renderer/Renderer.js";
import { FrameProvider } from "./core/FrameProvider.js";
import { DetectorFactory } from "./detector/DetectorFactory.js";
import { OpenCvLoader } from "./opencv/OpenCvLoader.js";
import { OpenCvFrameConverter } from "./opencv/OpenCvFrameConverter.js";


console.log("Application started");


const video =
    document.getElementById("video");

const canvas =
    document.getElementById("canvas");


// ----------------------------------------------------
// 1. Завантаження OpenCV
// ----------------------------------------------------

console.log(
    "global cv:",
    typeof window.cv
);


const cv =
    await OpenCvLoader.waitForOpenCV();


console.log(
    "OpenCV initialized"
);


// Перевірка ArUco API

console.log(
    "cv.aruco_ArucoDetector:",
    cv.aruco_ArucoDetector
);


// ----------------------------------------------------
// 2. Створення детектора
// ----------------------------------------------------

const detector =
    DetectorFactory.create(cv);


console.log(
    "Detector created:",
    detector
);


// ----------------------------------------------------
// 3. Створення модулів
// ----------------------------------------------------

const camera =
    new CameraManager(video);


const renderer =
    new Renderer(canvas);


const frameProvider =
    new FrameProvider(video);

const frameConverter =
    new OpenCvFrameConverter(cv);


console.log(
    "FrameConverter created"
);


// ----------------------------------------------------
// 4. Запуск камери
// ----------------------------------------------------

async function start() {

    console.log(
        "Starting camera"
    );


    // ----------------------------------------
    // 1. Запуск камери
    // ----------------------------------------

    await camera.start();


    console.log(
        "Camera started",
        video.videoWidth,
        video.videoHeight
    );


    // ----------------------------------------
    // 2. Налаштування розмірів
    // ----------------------------------------

    renderer.resize(
        video.videoWidth,
        video.videoHeight
    );


    frameProvider.resize(
        video.videoWidth,
        video.videoHeight
    );


    // ----------------------------------------
    // 3. Перевірка отримання кадру
    // ----------------------------------------

    if (
        video.readyState ===
        HTMLMediaElement.HAVE_ENOUGH_DATA
    ) {


        const frame =
            frameProvider.getFrame();


        console.log(
            "Frame received:",
            frame.width,
            frame.height,
            frame.timestamp
        );


        // ------------------------------------
        // 4. Конвертація Frame -> cv.Mat
        // ------------------------------------

        const mat =
            frameConverter.convert(frame);


/*        console.log(
            "OpenCV Mat:",
            "rows =", mat.rows,
            "cols =", mat.cols,
            "type =", mat.type()
        );
*/

        // ------------------------------------
        // 5. Тест ArUco detection
        // ------------------------------------

        const markers =
            detector.detect(mat);

/*
        console.log(
            "Detection result:",
            markers
        );


        if (
            markers.ids &&
            markers.ids.rows > 0
        ) {

            console.log(
                "Markers detected:",
                markers.ids.data
            );

        }
        else {

            console.log(
                "No markers detected"
            );

        }
*/

        // ------------------------------------
        // 6. Звільнення пам'яті OpenCV
        // ------------------------------------

        if (markers.corners) {

            markers.corners.delete();

        }


        if (markers.rejected) {

            markers.rejected.delete();

        }


        if (markers.ids) {

            markers.ids.delete();

        }


        mat.delete();

    }
    else {

        console.warn(
            "Video frame is not ready"
        );

    }


    // ----------------------------------------
    // Поки цикл не запускаємо
    // ----------------------------------------

    requestAnimationFrame(loop);

}


// ----------------------------------------------------
// 5. Основний цикл
// ----------------------------------------------------

function loop() {

    if (
        video.readyState ===
        HTMLMediaElement.HAVE_ENOUGH_DATA
    ) {

        // ----------------------------------------
        // 1. Отримання кадру
        // ----------------------------------------

        const frame = frameProvider.getFrame();

        // ----------------------------------------
        // 2. Frame -> OpenCV Mat
        // ----------------------------------------

        const mat = frameConverter.convert(frame);

        // ----------------------------------------
        // 3. ArUco detection
        // ----------------------------------------

        const markers = detector.detect(mat);
        
        markers.count = markers.ids.rows;

        if (
            markers.ids &&
            markers.ids.rows > 0
        ) {

/*
            console.log(
                "Markers detected:",
                markers.ids.data
            );
*/

        }

        // ----------------------------------------
        // 4. Відображення відео
        // ----------------------------------------

        renderer.drawVideo(video);

/*        console.log(
            "Before drawMarkers:",
            markers.corners.size(),
            markers.ids.rows
        );
*/

        renderer.drawMarkers(markers);

        // ----------------------------------------
        // 5. Очистка пам'яті
        // ----------------------------------------
        
        if (markers.corners) {

            markers.corners.delete();

        }


        if (markers.ids) {

            markers.ids.delete();

        }


        if (markers.rejected) {

            markers.rejected.delete();

        }

        mat.delete();

    }

    requestAnimationFrame(loop);

}

// ----------------------------------------------------

start();

