import { Point } from '../models/Point.js';

export class PerspectiveCorrector {
    constructor(cv) {
        this.cv = cv;
    }

    correct(markers, boardCenter, cameraHeight, markerSize, boardDimensions, image_to_board_matrix, board_to_image_matrix, objectsData = {}) {
        if (!image_to_board_matrix || image_to_board_matrix.empty() || !board_to_image_matrix || board_to_image_matrix.empty()) {
            return markers;
        }
        
        const gridToMmScale = boardDimensions / 8.0;

        for (const marker of markers) {
            // Always initialize corrected fields with raw/EMA ones first
            marker.correctedCorners = marker.corners.map(c => new Point(c.x, c.y));
            marker.correctedCenter = marker.center;

            // Step 1: Transform pixel corners to grid corners, then scale to millimeters
            const gridCorners = this._transformPoints(marker.corners, image_to_board_matrix);
            const mmCorners = gridCorners.map(c => new Point(c.x * gridToMmScale, c.y * gridToMmScale));

            // Step 2: Calculate center, size, and height in millimeters from the uncorrected projected shape
            const centerMm = this._calculateCenter(mmCorners);
            const sPiece = this._calculateAverageSideLength(mmCorners);

            // Look up predefined height from objectsData
            const objDef = objectsData[marker.id];
            let h = 0;
            if (objDef && typeof objDef.marker_height === "number") {
                h = objDef.marker_height;
            } else {
                // Fallback to dynamic estimation if predefined height is not available
                if (sPiece < markerSize) {
                    marker.estimatedHeight = 0;
                    continue;
                }
                h = cameraHeight * (1 - markerSize / sPiece);
            }

            marker.estimatedHeight = h; // Store for debugging/display
            if (h <= 0) continue;

            // Step 3: Calculate the single correction vector in millimeter space
            const v = new Point(centerMm.x - boardCenter.x, centerMm.y - boardCenter.y);
            const alpha = h / cameraHeight;
            const correctionVector = new Point(v.x * alpha, v.y * alpha);
            
            // Step 4: Apply the correction to all four corners in millimeter space
            const correctedMmCorners = mmCorners.map(c => new Point(c.x - correctionVector.x, c.y - correctionVector.y));

            // Step 5: Un-scale the corrected millimeter corners back to grid points
            const correctedGridCorners = correctedMmCorners.map(c => new Point(c.x / gridToMmScale, c.y / gridToMmScale));

            // Step 6: Transform the corrected grid points back to pixel coordinates
            const correctedPixelCorners = this._transformPoints(correctedGridCorners, board_to_image_matrix);

            // Step 7: Update the marker object with the fully corrected data
            if (correctedPixelCorners.length === 4) {
                marker.correctedCorners = correctedPixelCorners;
                marker.correctedCenter = this._calculateCenter(correctedPixelCorners);

                // Snap the yellow rectangle center to the center of the nearest grid cell
                const gridCenter = this._calculateCenter(correctedGridCorners);
                const col = Math.floor(gridCenter.x);
                const row = Math.floor(gridCenter.y);

                if (col >= 0 && col < 8 && row >= 0 && row < 8) {
                    const snappedGridCenter = new Point(col + 0.5, row + 0.5);
                    const snappedPixelCenterArray = this._transformPoints([snappedGridCenter], board_to_image_matrix);
                    if (snappedPixelCenterArray.length === 1) {
                        const snappedPixelCenter = snappedPixelCenterArray[0];
                        const dx = snappedPixelCenter.x - marker.correctedCenter.x;
                        const dy = snappedPixelCenter.y - marker.correctedCenter.y;
                        
                        marker.correctedCorners = marker.correctedCorners.map(c => new Point(c.x + dx, c.y + dy));
                        marker.correctedCenter = snappedPixelCenter;
                    }
                }
            }
        }

        return markers;
    }

    _transformPoints(points, homography) {
        if (points.length === 0) {
            return [];
        }
        const src = this.cv.matFromArray(points.length, 1, this.cv.CV_32FC2, points.flatMap(p => [p.x, p.y]));
        const dst = new this.cv.Mat();
        
        this.cv.perspectiveTransform(src, dst, homography);
        
        const transformed = [];
        for (let i = 0; i < dst.rows; i++) {
            transformed.push(new Point(dst.floatAt(i, 0), dst.floatAt(i, 1)));
        }

        src.delete();
        dst.delete();
        
        return transformed;
    }

    _calculateCenter(corners) {
        if (corners.length < 4) return new Point();
        let x = 0;
        let y = 0;
        for (const p of corners) {
            x += p.x;
            y += p.y;
        }
        return new Point(x / 4, y / 4);
    }

    _calculateAverageSideLength(corners) {
        const dist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
        
        const side1 = dist(corners[0], corners[1]);
        const side2 = dist(corners[1], corners[2]);
        const side3 = dist(corners[2], corners[3]);
        const side4 = dist(corners[3], corners[0]);
        
        return (side1 + side2 + side3 + side4) / 4;
    }
}
