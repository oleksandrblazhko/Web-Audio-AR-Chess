import { CameraManager } from "./camera/CameraManager.js";
import { Renderer } from "./renderer/Renderer.js";
import { FrameProvider } from "./core/FrameProvider.js";
import { DetectorFactory } from "./detector/DetectorFactory.js";
import { OpenCvLoader } from "./opencv/OpenCvLoader.js";
import { OpenCvFrameConverter } from "./opencv/OpenCvFrameConverter.js";
import { AccessScreen } from "./ui/AccessScreen.js";

// Імпорт нових модулів інтеграції
import { Config } from "./config/config.js";
import { Calibration } from "./core/Calibration.js";
import { WebAudioManager } from "./audio/WebAudioManager.js";
import { ProximityDetector } from "./detector/ProximityDetector.js";
import { Point } from "./models/Point.js";

console.log("Application starting...");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

// ----------------------------------------------------
// 1. Завантаження OpenCV
// ----------------------------------------------------
const cv = await OpenCvLoader.waitForOpenCV();

// ----------------------------------------------------
// 2. Створення модулів
// ----------------------------------------------------
const detector = DetectorFactory.create(cv);
const camera = new CameraManager(video);
const renderer = new Renderer(canvas);
const frameProvider = new FrameProvider(video);
const frameConverter = new OpenCvFrameConverter(cv);
const accessScreen = new AccessScreen();

const calibration = new Calibration(cv);
const audioManager = new WebAudioManager(Config.audioDirectory);
const proximityDetector = new ProximityDetector(audioManager, 500);

// Глобальні змінні стану
const visibleMarkers = {};  // markerId -> Marker
const markerFilters = {};   // markerId -> Array of 4 Point (for EMA)
let objectsData = {};
let safetyZoneMarginPct = 10; // Default safety zone margin percentage

let mirrorEnabled = false;
let showOptimalZone = false;

// ----------------------------------------------------
// 3. Завантаження конфігурації
// ----------------------------------------------------
async function loadConfigurations() {
    let externalConfig = {};
    try {
        const resConf = await fetch(`config.json?t=${Date.now()}`);
        externalConfig = await resConf.json();
        Object.assign(Config, externalConfig);
        if (typeof externalConfig.safety_zone_margin_pct === "number") {
            safetyZoneMarginPct = externalConfig.safety_zone_margin_pct;
            console.log(`Loaded safety zone margin: ${safetyZoneMarginPct}%`);
        }
        if (Config.audioDirectory) {
            audioManager.audioBaseDir = Config.audioDirectory;
        }
        console.log("Loaded configuration from config.json:", Config);
    } catch (e) {
        console.warn("Failed to load config.json, using defaults:", e);
    }

    try {
        const resObj = await fetch(`objects.json?t=${Date.now()}`);
        const config = await resObj.json();
        
        const borderIds = [];
        let controlId = null;

        for (const obj of config.objects) {
            objectsData[obj.marker_id] = obj;
            if (obj.obj_type === "border") {
                borderIds.push(obj.marker_id);
            } else if (obj.obj_type === "control") {
                controlId = obj.marker_id;
            }
        }

        // Якщо в config.json не перевизначено ці параметри, використовуємо їх з objects.json
        if (config.audio_directory && (!externalConfig || (!externalConfig.audioDirectory && !externalConfig.audio_directory))) {
            Config.audioDirectory = config.audio_directory;
            audioManager.audioBaseDir = config.audio_directory;
            console.log("Using audio directory from objects.json:", Config.audioDirectory);
        }
        if (borderIds.length === 4 && (!externalConfig || !externalConfig.boundaryIds)) {
            Config.boundaryIds = borderIds;
            console.log("Using boundary IDs from objects.json:", Config.boundaryIds);
        }
        if (controlId !== null && (!externalConfig || externalConfig.controlMarkerId === undefined)) {
            Config.controlMarkerId = controlId;
            console.log("Using control marker ID from objects.json:", Config.controlMarkerId);
        }

        console.log(`Loaded ${Object.keys(objectsData).length} game objects.`);
    } catch (e) {
        console.error("Failed to load objects.json:", e);
    }
}



// Створення панелі керування (UI)
function createControlPanel() {
    const panel = document.createElement("div");
    panel.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 15px;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 10px 20px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
        z-index: 1000;
        align-items: center;
    `;

    const applyBtnStyles = (btn, bgGrad) => {
        btn.style.cssText = `
            background: ${bgGrad};
            border: none;
            color: white;
            padding: 10px 18px;
            border-radius: 8px;
            font-size: 14px;
            font-family: Inter, sans-serif;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            outline: none;
        `;
    };

    // Кнопка Калібрування
    const calibBtn = document.createElement("button");
    calibBtn.innerText = "Калібрувати";
    applyBtnStyles(calibBtn, "linear-gradient(135deg, #FF416C, #FF4B2B)");
    calibBtn.onclick = () => {
        if (!calibration.isCalibratingNow()) {
            calibration.start();
            audioManager.playCalibrationBeeps();
            
            let countdown = 3;
            calibBtn.disabled = true;
            calibBtn.style.opacity = "0.7";
            const timer = setInterval(() => {
                countdown--;
                if (countdown <= 0) {
                    clearInterval(timer);
                    calibBtn.innerText = "Калібрувати";
                    calibBtn.disabled = false;
                    calibBtn.style.opacity = "1";
                } else {
                    calibBtn.innerText = `Калібрування (${countdown}c)...`;
                }
            }, 1000);
            calibBtn.innerText = `Калібрування (${countdown}c)...`;
        }
    };
    calibBtn.onmouseover = () => { if (!calibBtn.disabled) calibBtn.style.transform = "scale(1.05)"; };
    calibBtn.onmouseout = () => { calibBtn.style.transform = "scale(1)"; };

    // Кнопка Дзеркало
    const mirrorBtn = document.createElement("button");
    mirrorBtn.innerText = "Дзеркало: Вимк";
    applyBtnStyles(mirrorBtn, "linear-gradient(135deg, #1f4068, #162447)");
    mirrorBtn.onclick = () => {
        mirrorEnabled = !mirrorEnabled;
        mirrorBtn.innerText = `Дзеркало: ${mirrorEnabled ? "Увімк" : "Вимк"}`;
        mirrorBtn.style.background = mirrorEnabled 
            ? "linear-gradient(135deg, #00f0ff, #0072ff)" 
            : "linear-gradient(135deg, #1f4068, #162447)";
    };
    mirrorBtn.onmouseover = () => { mirrorBtn.style.transform = "scale(1.05)"; };
    mirrorBtn.onmouseout = () => { mirrorBtn.style.transform = "scale(1)"; };

    // Кнопка Оптимальна Зона
    const zoneBtn = document.createElement("button");
    zoneBtn.innerText = "Зона: Вимк";
    applyBtnStyles(zoneBtn, "linear-gradient(135deg, #1f4068, #162447)");
    zoneBtn.onclick = () => {
        showOptimalZone = !showOptimalZone;
        zoneBtn.innerText = `Зона: ${showOptimalZone ? "Увімк" : "Вимк"}`;
        zoneBtn.style.background = showOptimalZone 
            ? "linear-gradient(135deg, #00f0ff, #0072ff)" 
            : "linear-gradient(135deg, #1f4068, #162447)";
    };
    zoneBtn.onmouseover = () => { zoneBtn.style.transform = "scale(1.05)"; };
    zoneBtn.onmouseout = () => { zoneBtn.style.transform = "scale(1)"; };

    panel.appendChild(calibBtn);
    panel.appendChild(mirrorBtn);
    panel.appendChild(zoneBtn);
    document.body.appendChild(panel);
}

// ----------------------------------------------------
// 4. Запуск камери та завантаження ресурсів
// ----------------------------------------------------
async function start() {
    // Спочатку завантажуємо конфігурації
    await loadConfigurations();

    console.log("Starting camera...");
    await camera.start();
    console.log("Camera started", video.videoWidth, video.videoHeight);

    renderer.resize(video.videoWidth, video.videoHeight);
    frameProvider.resize(video.videoWidth, video.videoHeight);
    
    // Створюємо елементи UI
    createControlPanel();

    requestAnimationFrame(loop);
}

// ----------------------------------------------------
// 5. Основний цикл обробки кадрів
// ----------------------------------------------------
function loop() {
    if (video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
        const frameCanvas = frameProvider.getFrame();
        const mat = frameConverter.convert(frameCanvas);
        const now = performance.now();
        
        // --- Step 1: Detect raw markers ---
        const detectedMarkers = detector.detect(mat);

        // --- Step 2: Update visible markers list and apply EMA smoothing ---
        for (const marker of detectedMarkers) {
            marker.timestamp = now;

            if (!markerFilters[marker.id]) {
                // First time seeing this marker, initialize filter
                markerFilters[marker.id] = marker.corners.map(c => new Point(c.x, c.y));
            } else {
                // Apply EMA filter to the raw corners
                const prevCorners = markerFilters[marker.id];
                for (let j = 0; j < 4; j++) {
                    prevCorners[j].x = Config.emaAlpha * marker.corners[j].x + (1.0 - Config.emaAlpha) * prevCorners[j].x;
                    prevCorners[j].y = Config.emaAlpha * marker.corners[j].y + (1.0 - Config.emaAlpha) * prevCorners[j].y;
                }
                // Overwrite the marker's corners with the smoothed version
                marker.corners = prevCorners;
                marker.center = marker.calculateCenter();
            }
            // Add/update the marker in the global list
            visibleMarkers[marker.id] = marker;
        }

        // --- Step 3: Clean up stale markers ---
        for (const id in visibleMarkers) {
            if (now - visibleMarkers[id].timestamp > Config.markerTimeoutMs) {
                delete visibleMarkers[id];
                delete markerFilters[id];
            }
        }
        
        // --- Step 4: Apply perspective correction (modifies markers in place) ---
        const markersToProcess = Object.values(visibleMarkers);
        detector.correctMarkers(markersToProcess, calibration);

        // --- Step 5: Update calibration logic ---
        if (calibration.isCalibratingNow()) {
            calibration.update(visibleMarkers, Config.boundaryIds);
        }

        // --- Step 6: Proximity checks ---
        let closestDistance = Infinity;
        proximityDetector.checkCameraProximity(visibleMarkers, objectsData, calibration, Config.cameraProxHeightThreshold);
        
        const controlMarker = visibleMarkers[Config.controlMarkerId];
        closestDistance = proximityDetector.checkControlMarkerProximity(
            controlMarker,
            visibleMarkers,
            objectsData,
            calibration,
            Config.gridProximityThreshold
        );

        // --- Step 7: Rendering ---
        const markersToRender = Object.values(visibleMarkers).filter(marker => 
            Config.anyMarkerVision || objectsData.hasOwnProperty(marker.id)
        );

        renderer.clear();

        if (mirrorEnabled) {
            renderer.ctx.save();
            renderer.ctx.translate(renderer.canvas.width, 0);
            renderer.ctx.scale(-1, 1);
            renderer.ctx.drawImage(frameCanvas, 0, 0);
            renderer.ctx.restore();
        } else {
            renderer.ctx.drawImage(frameCanvas, 0, 0);
        }

        renderer.drawBoundary(calibration);
        renderer.drawTableGrid(calibration, Config.gridColor);
        renderer.drawMarkers(markersToRender, Config.textColor);
        renderer.drawProjectedMarkers(markersToRender, calibration, objectsData);
        
        if (showOptimalZone) {
            renderer.drawOptimalZone(safetyZoneMarginPct);
        }

        renderer.drawUIInfo(
            calibration,
            Config.gridProximityThreshold,
            closestDistance,
            !!controlMarker,
            Config.cameraProxHeightThreshold,
            visibleMarkers
        );

        mat.delete();
    }
    
    requestAnimationFrame(loop);
}

// ----------------------------------------------------
// Запуск
// ----------------------------------------------------
await accessScreen.waitForClick();
await start();
