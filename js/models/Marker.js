import { Point } from "./Point.js";

export class Marker {

    constructor(id = -1) {
        this.id = id;
        this.corners = [];
        this.timestamp = performance.now();
        this.center = null; // The center of the marker in PIXEL coordinates.
        this.estimatedHeight = 0; // The estimated height in mm for debugging.
        this.correctedCorners = [];
        this.correctedCenter = null;
    }

    addCorner(x, y) {
        this.corners.push(new Point(x, y));
    }

    calculateCenter() {
        if (this.corners.length === 0) {
            return new Point();
        }
        let x = 0;
        let y = 0;
        for (const p of this.corners) {
            x += p.x;
            y += p.y;
        }
        return new Point(x / this.corners.length, y / this.corners.length);
    }

    getPixelWidth() {
        if (this.corners.length < 4) {
            return 0;
        }
        // d1 - відстань між кутами 0 та 1
        const d1 = Math.hypot(this.corners[0].x - this.corners[1].x, this.corners[0].y - this.corners[1].y);
        // d2 - відстань між кутами 2 та 3
        const d2 = Math.hypot(this.corners[2].x - this.corners[3].x, this.corners[2].y - this.corners[3].y);
        return (d1 + d2) / 2.0;
    }
}
