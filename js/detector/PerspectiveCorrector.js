import { Point } from '../models/Point.js';

/**
 * Implements the algorithm to compensate for perspective distortion of ArUco markers.
 * The algorithm is described in .tasks/task2.md.
 */
export class PerspectiveCorrector {
    constructor(cv) {
        this.cv = cv;
    }

    /**
     * Corrects the center of the markers for perspective distortion.
     * @param {Marker[]} markers - The array of detected markers.
     * @param {Point} boardCenter - The center of the chessboard in board coordinates (mm).
     * @param {number} cameraHeight - The height of the camera above the board (mm).
     * @param {number} markerSize - The physical size of the markers (mm).
     * @param {cv.Mat} homography - The homography matrix to transform image to board coordinates.
     * @returns {Marker[]} The markers with corrected center points.
     */
    correct(markers, boardCenter, cameraHeight, markerSize, homography) {
        if (!homography || homography.empty()) {
            return markers; // Cannot correct without homography
        }

        for (const marker of markers) {
            // The detector provides corners in image coordinates (pixels).
            // We need to transform them to board coordinates (millimeters).
            const transformedCorners = this._transformCorners(marker.corners, homography);

            // 7. Визначення центру маркера (у міліметрах на площині дошки)
            const centerMarker = this._calculateCenter(transformedCorners);

            // 8. Визначення видимого розміру маркера (у міліметрах на площині дошки)
            const sPiece = this._calculateAverageSideLength(transformedCorners);

            // 10. Оцінка висоти
            // h = H · (1 - M / Spiece)
            const h = cameraHeight * (1 - markerSize / sPiece);

            if (h <= 0) {
                // Height is not positive, no correction needed or possible
                marker.correctedCenter = centerMarker;
                continue;
            }

            // 11. Визначення напрямку перспективного зміщення
            // V = CenterMarker − CenterBoard
            const v = new Point(
                centerMarker.x - boardCenter.x,
                centerMarker.y - boardCenter.y
            );

            // 12. Компенсація координат
            // Corrected = CenterMarker − α · V, where α = h / H
            const alpha = h / cameraHeight;
            const correctedCenter = new Point(
                centerMarker.x - alpha * v.x,
                centerMarker.y - alpha * v.y
            );
            
            // Зберігаємо оригінальний та скоригований центр
            marker.originalCenter = centerMarker;
            marker.center = correctedCenter; // Оновлюємо основний центр на скоригований
        }

        return markers;
    }

    /**
     * Transforms marker corners from image coordinates to board coordinates.
     * @param {Point[]} corners - Array of 4 corner points in image coordinates.
     * @param {cv.Mat} homography - The homography matrix.
     * @returns {Point[]} Array of 4 transformed corner points in board coordinates.
     * @private
     */
    _transformCorners(corners, homography) {
        const src = this.cv.matFromArray(4, 1, this.cv.CV_32FC2, corners.flatMap(p => [p.x, p.y]));
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

    /**
     * Calculates the center of a marker from its corners.
     * @param {Point[]} corners - Array of 4 corner points.
     * @returns {Point} The center point.
     * @private
     */
    _calculateCenter(corners) {
        let x = 0;
        let y = 0;
        for (const p of corners) {
            x += p.x;
            y += p.y;
        }
        return new Point(x / 4, y / 4);
    }

    /**
     * Calculates the average side length of a marker from its corners.
     * @param {Point[]} corners - Array of 4 corner points.
     * @returns {number} The average side length.
     * @private
     */
    _calculateAverageSideLength(corners) {
        const dist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
        
        const side1 = dist(corners[0], corners[1]);
        const side2 = dist(corners[1], corners[2]);
        const side3 = dist(corners[2], corners[3]);
        const side4 = dist(corners[3], corners[0]);
        
        return (side1 + side2 + side3 + side4) / 4;
    }
}
