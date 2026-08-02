import { CameraManager } from "./camera/CameraManager.js";
import { Renderer } from "./renderer/Renderer.js";
import { FrameProvider } from "./core/FrameProvider.js";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

const camera = new CameraManager(video);
const renderer = new Renderer(canvas);
const frameProvider = new FrameProvider(video);

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

    const frame = frameProvider.getFrame();

    renderer.drawVideo(video);

    requestAnimationFrame(loop);

}

start();