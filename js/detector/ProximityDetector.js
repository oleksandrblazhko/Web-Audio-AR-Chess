export class ProximityDetector {
    constructor(audioManager, gracePeriodMs = 500) {
        this.audioManager = audioManager;
        this.gracePeriodMs = gracePeriodMs;

        // Стан наближення до камери
        this.cameraProxLastSeen = new Map(); // markerId -> timestamp

        // Стан наближення до маркера керування (lock-on)
        this.lockedObjectState = null;
        this.lastProximityTime = 0;
    }

    checkCameraProximity(markers, objectsData, calibration, heightThreshold) {
        if (calibration.pCalib <= 0) return;

        const now = performance.now();

        // 1. Початок відтворення для нових об'єктів заблизько до камери
        for (const markerId in markers) {
            const marker = markers[markerId];
            const objDef = objectsData[markerId];

            if (objDef && objDef.obj_type !== "control" && objDef.obj_type !== "border") {
                const p = marker.getPixelWidth();
                if (p > 0) {
                    // Розраховуємо відносну висоту підняття: h_rel = 1 - pCalib / p
                    const hRel = 1.0 - (calibration.pCalib / p);
                    if (hRel > heightThreshold) {
                        this.cameraProxLastSeen.set(parseInt(markerId), now);
                        if (objDef.audio_name) {
                            this.audioManager.playCameraProxSound(parseInt(markerId), objDef.audio_name);
                        }
                    }
                }
            }
        }

        // 2. Зупинка відтворення для об'єктів, що віддалилися
        for (const markerId of this.audioManager.cameraProxSounds.keys()) {
            const lastSeen = this.cameraProxLastSeen.get(markerId) || 0;
            if (now - lastSeen > this.gracePeriodMs) {
                this.audioManager.stopCameraProxSound(markerId);
                this.cameraProxLastSeen.delete(markerId);
            }
        }
    }

    checkControlMarkerProximity(controlMarker, markers, objectsData, calibration, proximityThreshold) {
        if (calibration.pCalib <= 0) return Infinity;

        const now = performance.now();
        let closestDistForDisplay = Infinity;

        if (!controlMarker) {
            // Якщо маркер керування не видно, перевіряємо чи час очікування завершився
            if (this.lockedObjectState && (now - this.lastProximityTime > this.gracePeriodMs)) {
                this.audioManager.stopLoopingSound();
                this.lockedObjectState = null;
            }
            return closestDistForDisplay;
        }

        const controlCenter = controlMarker.correctedCenter || controlMarker.center;
        const controlGridPt = calibration.projectToGrid(controlCenter);
        if (!controlGridPt) {
            return closestDistForDisplay;
        }

        // --- Крок 1: Перевірка та утримання поточного блокування ---
        if (this.lockedObjectState) {
            const rawDistance = Math.hypot(
                controlGridPt.x - this.lockedObjectState.savedPos.x,
                controlGridPt.y - this.lockedObjectState.savedPos.y
            );
            closestDistForDisplay = rawDistance;

            // Згладжування останніх 5 значень
            const distances = this.lockedObjectState.recentDistances;
            distances.push(rawDistance);
            if (distances.length > 5) distances.shift();
            const smoothedDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;

            const breakThreshold = proximityThreshold * 1.5; // Гістерезис

            if (smoothedDistance >= breakThreshold) {
                this.lockedObjectState = null; // Знімаємо блокування
            } else {
                this.audioManager.playLoopingSound(this.lockedObjectState.audioName);
                this.lastProximityTime = now;
            }
        }

        // --- Крок 2: Якщо блокування немає, шукаємо новий об'єкт ---
        if (!this.lockedObjectState) {
            for (const mid in objectsData) {
                const objDef = objectsData[mid];
                const objMarkerId = objDef.marker_id;

                if (objDef.obj_type !== "control" && objDef.obj_type !== "border" && markers[objMarkerId] && objMarkerId !== controlMarker.id) {
                    const objMarker = markers[objMarkerId];
                    const objCenter = objMarker.correctedCenter || objMarker.center;
                    const objGridPt = calibration.projectToGrid(objCenter);

                    if (objGridPt) {
                        const distance = Math.hypot(
                            controlGridPt.x - objGridPt.x,
                            controlGridPt.y - objGridPt.y
                        );

                        if (distance < proximityThreshold) {
                            this.lockedObjectState = {
                                markerId: objMarkerId,
                                savedPos: objGridPt,
                                audioName: objDef.audio_name,
                                recentDistances: [distance]
                            };
                            this.audioManager.playLoopingSound(objDef.audio_name);
                            this.lastProximityTime = now;
                            closestDistForDisplay = distance;
                            break;
                        }
                    }
                }
            }
        }

        // --- Крок 3: Обробка затримки відключення звуку ---
        if (!this.lockedObjectState && (now - this.lastProximityTime > this.gracePeriodMs)) {
            this.audioManager.stopLoopingSound();
        }

        // --- Крок 4: Оновлення відстані для відображення, навіть якщо не заблоковано ---
        if (!this.lockedObjectState) {
            for (const mid in objectsData) {
                const objDef = objectsData[mid];
                const objMarkerId = objDef.marker_id;

                if (objDef.obj_type !== "control" && objDef.obj_type !== "border" && markers[objMarkerId] && objMarkerId !== controlMarker.id) {
                    const objMarker = markers[objMarkerId];
                    const objCenter = objMarker.correctedCenter || objMarker.center;
                    const objGridPt = calibration.projectToGrid(objCenter);

                    if (objGridPt) {
                        const distance = Math.hypot(
                            controlGridPt.x - objGridPt.x,
                            controlGridPt.y - objGridPt.y
                        );
                        if (distance < (1.5 * proximityThreshold)) {
                            closestDistForDisplay = Math.min(distance, closestDistForDisplay);
                        }
                    }
                }
            }
        }

        return closestDistForDisplay;
    }
}
