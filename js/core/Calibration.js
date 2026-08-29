import { Point } from "../models/Point.js";

export class Calibration {
    constructor(cv, durationMs = 3000) {
        this.cv = cv;
        this.durationMs = durationMs;
        this.isCalibrating = false;
        this.data = {};
        
        // --- Results ---
        this.tableZone = [];            // [TL, TR, BR, BL] centers in pixels
        this.board_to_image_matrix = null; // cv.Mat (3x3 Homography)
        this.image_to_board_matrix = null; // cv.Mat (3x3 Homography)
        this.pCalib = 0;                // Reference pixel width of boundary markers on table
        this.startTime = 0;
    }

    start() {
        console.log("Starting calibration...");
        this.isCalibrating = true;
        this.startTime = performance.now();
        this.data = {};
        this.tableZone = [];
        if (this.board_to_image_matrix) {
            this.board_to_image_matrix.delete();
            this.board_to_image_matrix = null;
        }
        if (this.image_to_board_matrix) {
            this.image_to_board_matrix.delete();
            this.image_to_board_matrix = null;
        }
        this.pCalib = 0;
    }

    isCalibratingNow() {
        return this.isCalibrating;
    }

    update(visibleMarkers, boundaryIds, boundaryCorners) {
        if (!this.isCalibrating) return;

        const elapsed = performance.now() - this.startTime;
        if (elapsed > this.durationMs) {
            this.finish(boundaryIds, boundaryCorners);
            return;
        }

        // visibleMarkers is a Map or Object of markerId -> Marker
        for (const markerId of boundaryIds) {
            const marker = visibleMarkers[markerId];
            if (marker) {
                if (!this.data[markerId]) {
                    this.data[markerId] = { centers: [], widths: [] };
                }
                this.data[markerId].centers.push(marker.center);
                this.data[markerId].widths.push(marker.getPixelWidth());
            }
        }
    }

    finish(boundaryIds, boundaryCorners) {
        this.isCalibrating = false;
        console.log("Calibration finished. Calculating average positions...");

        const avgMarkerData = {};
        for (const markerId of boundaryIds) {
            const mData = this.data[markerId];
            if (mData && mData.centers.length > 0) {
                // Calculate average center (x, y)
                let sumX = 0;
                let sumY = 0;
                for (const pt of mData.centers) {
                    sumX += pt.x;
                    sumY += pt.y;
                }
                const avgCenter = new Point(sumX / mData.centers.length, sumY / mData.centers.length);
                
                // Calculate average width
                const avgWidth = mData.widths.reduce((sum, w) => sum + w, 0) / mData.widths.length;

                avgMarkerData[markerId] = {
                    center: avgCenter,
                    width: avgWidth
                };
            }
        }

        const visibleCount = Object.keys(avgMarkerData).length;
        if (visibleCount !== 4) {
            console.error(`Error: Could not define table zone. Only ${visibleCount} of 4 boundary markers were visible.`);
            this.data = {};
            return;
        }

        // Прив'язка кутів дошки за іменами маркерів з objects.json
        // (не залежить від розташування камери):
        // name -> кут у сітковому просторі (0..8)
        const CORNER_TO_BOARD = {
            "left-top-corner": [0, 0],     // a8
            "left-bottom-corner": [8, 0],  // h8
            "right-bottom-corner": [8, 8], // h1
            "right-top-corner": [0, 8]     // a1
        };
        const cornerOrder = [
            "left-top-corner",
            "left-bottom-corner",
            "right-bottom-corner",
            "right-top-corner"
        ];

        const idByName = {};
        for (const mid in (boundaryCorners || {})) {
            idByName[boundaryCorners[mid]] = mid;
        }

        const sortedPoints = [];
        const boardCorners = [];
        for (const name of cornerOrder) {
            const markerId = idByName[name];
            const mData = markerId !== undefined ? avgMarkerData[markerId] : null;
            if (!mData) {
                console.error(`Error: Could not define table zone. Border marker "${name}" was not found among calibrated markers. Check that objects.json names all 4 border objects.`);
                this.data = {};
                return;
            }
            sortedPoints.push(mData.center);
            boardCorners.push(CORNER_TO_BOARD[name]);
        }

        this.tableZone = sortedPoints;

        // Calculate average pixel width pCalib
        const widths = cornerOrder.map(name => avgMarkerData[idByName[name]].width);
        this.pCalib = widths.reduce((sum, w) => sum + w, 0) / 4;

        console.log("Calibration points sorted (a8, h8, h1, a1):", sortedPoints);
        console.log(`Average calibrated marker size pCalib: ${this.pCalib.toFixed(2)} px`);

        // OpenCV.js Perspective Transform calculation
        try {
            const srcArray = boardCorners.flat();
            const dstArray = [
                sortedPoints[0].x, sortedPoints[0].y,
                sortedPoints[1].x, sortedPoints[1].y,
                sortedPoints[2].x, sortedPoints[2].y,
                sortedPoints[3].x, sortedPoints[3].y
            ];

            const srcMat = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, srcArray);
            const dstMat = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, dstArray);

            this.board_to_image_matrix = this.cv.getPerspectiveTransform(srcMat, dstMat);
            this.image_to_board_matrix = this.cv.getPerspectiveTransform(dstMat, srcMat);

            srcMat.delete();
            dstMat.delete();

            console.log("Homography matrices successfully calculated.");
        } catch (e) {
            console.error("Failed to calculate homography matrices via OpenCV.js:", e);
        }

        this.data = {}; // Clear temp data
    }

    projectToGrid(pt) {
        if (!this.image_to_board_matrix) return null;
        
        // Homography matrices are double precision (64F) in OpenCV.js
        const h = this.image_to_board_matrix.data64F;
        
        const w = h[6] * pt.x + h[7] * pt.y + h[8];
        if (Math.abs(w) < 1e-5) return null;
        
        const x = (h[0] * pt.x + h[1] * pt.y + h[2]) / w;
        const y = (h[3] * pt.x + h[4] * pt.y + h[5]) / w;
        
        return new Point(x, y);
    }

    projectToImage(gridPt) {
        if (!this.board_to_image_matrix) return null;
        
        const h = this.board_to_image_matrix.data64F;
        
        const w = h[6] * gridPt.x + h[7] * gridPt.y + h[8];
        if (Math.abs(w) < 1e-5) return null;
        
        const x = (h[0] * gridPt.x + h[1] * gridPt.y + h[2]) / w;
        const y = (h[3] * gridPt.x + h[4] * gridPt.y + h[5]) / w;
        
        return new Point(x, y);
    }
}
