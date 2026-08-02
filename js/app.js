import { CameraManager } from "./camera/CameraManager.js";
import { Renderer } from "./renderer/Renderer.js";
import { FrameProvider } from "./core/FrameProvider.js";
import { DetectorFactory } from "./detector/DetectorFactory.js";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const camera = new CameraManager(video);
const renderer = new Renderer(canvas);
const frameProvider = new FrameProvider(video);
const detector = DetectorFactory.create();

async function start() {

    await camera.start();

    renderer.resize(
        video.videoWidth,
        video.videoHeight
    );

    frameProvider.resize(
        video.videoWidth,
        video.videoHeight
    );

    requestAnimationFrame(loop);

}

function loop() {

    // Отримання поточного кадру
    const frame = frameProvider.getFrame();

    // Пошук ArUco-маркерів
    const markers = detector.detect(frame);

    // Відображення відео
    renderer.drawVideo(video);

    // На наступному етапі тут буде:
    // renderer.drawMarkers(markers);

    requestAnimationFrame(loop);

}

start();
