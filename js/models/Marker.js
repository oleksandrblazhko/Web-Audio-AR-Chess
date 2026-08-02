import { Point } from "./Point.js";

export class Marker {

    constructor(id = -1) {

        this.id = id;
        this.corners = [];

    }

    addCorner(x, y) {

        this.corners.push(new Point(x, y));

    }

    get center() {

        if (this.corners.length === 0) {
            return new Point();
        }

        let x = 0;
        let y = 0;

        for (const p of this.corners) {

            x += p.x;
            y += p.y;

        }

        return new Point(
            x / this.corners.length,
            y / this.corners.length
        );

    }

}
