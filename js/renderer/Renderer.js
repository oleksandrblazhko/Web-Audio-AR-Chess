import { Point } from "../models/Point.js";

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawMarkers(markers, textColor) {
        if (!markers || markers.length === 0) return;

        const ctx = this.ctx;
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.font = "9px Arial";
        ctx.fillStyle = textColor || "yellow";

        for (const marker of markers) {
            if (marker.corners.length < 4) continue;

            // 1. Малювання рамки
            ctx.beginPath();
            ctx.moveTo(marker.corners[0].x, marker.corners[0].y);
            for (let j = 1; j < 4; j++) {
                ctx.lineTo(marker.corners[j].x, marker.corners[j].y);
            }
            ctx.closePath();
            ctx.stroke();

            // 2. Виведення ID маркера у стабільній позиції
            // Знаходимо верхню ліву точку обмежувального прямокутника
            let minX = Infinity;
            let minY = Infinity;
            for (const corner of marker.corners) {
                if (corner.x < minX) minX = corner.x;
                if (corner.y < minY) minY = corner.y;
            }

            ctx.fillText(`${marker.id}`, minX, minY - 20);
            if (marker.estimatedHeight > 0) {
                ctx.fillStyle = "orange";
                ctx.fillText(`h: ${marker.estimatedHeight.toFixed(1)}mm`, minX, minY - 5);
                ctx.fillStyle = textColor || "yellow";
            }
        }
    }

    drawBoundary(calibration) {
        if (!calibration || calibration.tableZone.length < 4) return;

        const ctx = this.ctx;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(calibration.tableZone[0].x, calibration.tableZone[0].y);
        for (let i = 1; i < 4; i++) {
            ctx.lineTo(calibration.tableZone[i].x, calibration.tableZone[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Позначення вершин
        ctx.fillStyle = "red";
        ctx.font = "14px Arial";
        const labels = ["TL", "TR", "BR", "BL"];
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(calibration.tableZone[i].x, calibration.tableZone[i].y, 5, 0, 2 * Math.PI);
            ctx.fill();
            // ctx.fillText(labels[i], calibration.tableZone[i].x - 15, calibration.tableZone[i].y - 10);
        }
    }

    drawTableGrid(calibration, gridColor) {
        if (!calibration || !calibration.board_to_image_matrix) return;

        const ctx = this.ctx;
        ctx.strokeStyle = gridColor || "cyan";
        ctx.lineWidth = 1.5;

        // Малюємо горизонтальні лінії сітки (0..8)
        for (let y = 0; y <= 8; y++) {
            const startPt = calibration.projectToImage(new Point(0, y));
            const endPt = calibration.projectToImage(new Point(8, y));

            if (startPt && endPt) {
                ctx.beginPath();
                ctx.moveTo(startPt.x, startPt.y);
                ctx.lineTo(endPt.x, endPt.y);
                ctx.stroke();
            }
        }

        // Малюємо вертикальні лінії сітки (0..8)
        for (let x = 0; x <= 8; x++) {
            const startPt = calibration.projectToImage(new Point(x, 0));
            const endPt = calibration.projectToImage(new Point(x, 8));

            if (startPt && endPt) {
                ctx.beginPath();
                ctx.moveTo(startPt.x, startPt.y);
                ctx.lineTo(endPt.x, endPt.y);
                ctx.stroke();
            }
        }
    }

    drawProjectedMarkers(markers, calibration, objectsData = {}) {
        if (!markers || markers.length === 0 || !calibration || !calibration.image_to_board_matrix) return;

        const ctx = this.ctx;

        for (const marker of markers) {
            // Проектуємо центр на сітку столу
            const gridPt = calibration.projectToGrid(marker.center);
            if (gridPt) {
                // Визначаємо колір: з об'єкта, або синій за замовчуванням
                const obj = objectsData[marker.id];
                const color = obj && obj.color ? obj.color : 'blue';

                // Малюємо на екрані невелике коло біля центру маркера із зазначенням координат сітки
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(marker.center.x, marker.center.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                /*
                ctx.fillStyle = "cyan";
                ctx.font = "12px Arial";
                ctx.fillText(
                    `Grid: (${gridPt.x.toFixed(1)}, ${gridPt.y.toFixed(1)})`,
                    marker.center.x + 10,
                    marker.center.y + 15
                );
                */
            }
        }
    }

    drawUIInfo(calibration, proximityThreshold, closestDistance, controlMarkerVisible, heightThreshold, visibleMarkers) {
        const ctx = this.ctx;
        ctx.fillStyle = "white";
        ctx.font = "18px Inter, Arial";

        let yOffset = 30;

        // Статус калібрування
        if (calibration.isCalibrating) {
            ctx.fillStyle = "orange";
            ctx.fillText("Калібрування... тримайте всі 4 кутові маркери в полі зору", 20, yOffset);
        } else if (calibration.tableZone.length === 4) {
            ctx.fillStyle = "lightgreen";
            // ctx.fillText("Калібрування завершено (Стіл налаштовано)", 20, yOffset);
        } else {
            ctx.fillStyle = "tomato";
            ctx.fillText("Калібрування не виконано (Натисніть кнопку 'Калібрувати')", 20, yOffset);
        }
        yOffset += 30;

        ctx.fillStyle = "white";
        // ctx.fillText(`Поріг наближення на сітці: ${proximityThreshold.toFixed(1)} клітинок`, 20, yOffset);
        yOffset += 25;

        if (controlMarkerVisible) {
           // ctx.fillText("Маркер керування: ВИДИМИЙ", 20, yOffset);
            yOffset += 25;
            
            if (isFinite(closestDistance)) {
                ctx.fillStyle = closestDistance < proximityThreshold ? "tomato" : "lightgreen";
                // ctx.fillText(`Найближча відстань: ${closestDistance.toFixed(2)} клітинок`, 20, yOffset);
            } else {
                // ctx.fillText("Найближча відстань: -", 20, yOffset);
            }
        } else {
            ctx.fillStyle = "orange";
            ctx.fillText("Маркер керування: НЕВИДИМИЙ", 20, yOffset);
        }
        yOffset += 35;

        // Показ Z-висоти для маркерів
        if (calibration.pCalib > 0) {
            ctx.fillStyle = "yellow";
            ctx.font = "14px Arial";
            // ctx.fillText("Висота підняття маркерів (Z-вісь):", 20, yOffset);
            yOffset += 20;

            for (const id in visibleMarkers) {
                const marker = visibleMarkers[id];
                if (marker.id === calibration.controlMarkerId) continue;
                const p = marker.getPixelWidth();
                const hRel = 1.0 - (calibration.pCalib / p);
                /*
                if (hRel > 0.05) { // Показуємо тільки якщо помітно піднятий
                    const isCloseToCam = hRel > heightThreshold;
                    ctx.fillStyle = isCloseToCam ? "tomato" : "yellow";
                    ctx.fillText(
                        `ID ${marker.id}: H_rel = ${(hRel * 100).toFixed(0)}% ${isCloseToCam ? "(БЛИЗЬКО ДО КАМЕРИ!)" : ""}`,
                        20,
                        yOffset
                    );
                    yOffset += 20;
                }
                */
            }
        }
    }

    drawOptimalZone(marginPct) {
        if (typeof marginPct !== "number") return;

        const W = this.canvas.width;
        const H = this.canvas.height;
        const marginX = W * marginPct / 100;
        const marginY = H * marginPct / 100;

        const ctx = this.ctx;
        ctx.strokeStyle = "rgba(255, 165, 0, 0.6)"; // Напівпрозорий помаранчевий
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]); // Пунктирна лінія

        ctx.beginPath();
        ctx.moveTo(marginX, marginY);
        ctx.lineTo(W - marginX, marginY);
        ctx.lineTo(W - marginX, H - marginY);
        ctx.lineTo(marginX, H - marginY);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]); // Скидаємо пунктир
        
        ctx.fillStyle = "rgba(255, 165, 0, 0.6)";
        ctx.font = "12px Arial";
        ctx.fillText("Безпечна зона", marginX + 5, marginY + 15);
    }
}
