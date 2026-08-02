import { CameraManager } from "./camera/CameraManager.js";
import { Renderer } from "./renderer/Renderer.js";
import { FrameProvider } from "./core/FrameProvider.js";
import { DetectorFactory } from "./detector/DetectorFactory.js";
import { OpenCvLoader } from "./opencv/OpenCvLoader.js";
import { OpenCvFrameConverter } from "./opencv/OpenCvFrameConverter.js";
import { AccessScreen } from "./ui/AccessScreen.js";

console.log("Application started");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
// ----------------------------------------------------
// 1. Завантаження OpenCV
// ----------------------------------------------------
const cv = await OpenCvLoader.waitForOpenCV();
// ----------------------------------------------------
// 2. Створення детектора
// ----------------------------------------------------
const detector = DetectorFactory.create(cv);
console.log("Detector created:",detector);
// ----------------------------------------------------
// 3. Створення модулів
// ----------------------------------------------------
const camera = new CameraManager(video);
const renderer = new Renderer(canvas);
const frameProvider = new FrameProvider(video);
const frameConverter = new OpenCvFrameConverter(cv);
const accessScreen = new AccessScreen();
// ----------------------------------------------------
// 4. Запуск камери
// ----------------------------------------------------

async function start() {
    console.log("Starting camera");
    // ----------------------------------------
    // 1. Запуск камери
    // ----------------------------------------
    await camera.start();
    console.log("Camera started",video.videoWidth,video.videoHeight);
    // ----------------------------------------
    // 2. Налаштування розмірів
    // ----------------------------------------
    renderer.resize(video.videoWidth,video.videoHeight);
    frameProvider.resize(video.videoWidth,video.videoHeight);
    // ----------------------------------------
    // 3. Перевірка отримання кадру
    // ----------------------------------------
    if (video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
        const frame = frameProvider.getFrame();
        // ------------------------------------
        // 4. Конвертація Frame -> cv.Mat
        // ------------------------------------
        const mat = frameConverter.convert(frame);
        // ------------------------------------
        // 5. Тест ArUco detection
        // ------------------------------------
        const markers =  detector.detect(mat);
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
        console.warn("Video frame is not ready");
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
        const frameCanvas = frameProvider.getFrame();
        const mat = frameConverter.convert(frameCanvas);
        const markers = detector.detect(mat);
        markers.count = markers.ids.rows;
        renderer.ctx.drawImage(frameCanvas,0,0);
        renderer.drawMarkers(markers);
        if(markers.corners)
            markers.corners.delete();
        if(markers.ids)
            markers.ids.delete();
        if(markers.rejected)
            markers.rejected.delete();
        mat.delete();
    }
    requestAnimationFrame(loop);
}

// ----------------------------------------------------
await accessScreen.waitForClick();
await start();
