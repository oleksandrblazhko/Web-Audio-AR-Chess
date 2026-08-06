import { Point } from '../models/Point.js';

export class PerspectiveCorrector {
    constructor(cv) {
        this.cv = cv;
    }

    // Modified method signature: now accepts a single marker and markerHeight
    correct(marker, boardCenter, cameraHeight, boardDimensions, image_to_board_matrix, board_to_image_matrix, markerHeight) {
        if (!image_to_board_matrix || image_to_board_matrix.empty() || !board_to_image_matrix || board_to_image_matrix.empty()) {
            // Return early if matrices are not valid. For a single marker, this just means no correction.
            return;
        }
        
        const gridToMmScale = boardDimensions / 8.0;

        // Step 1: Transform pixel corners to grid corners, then scale to millimeters
        const gridCorners = this._transformPoints(marker.corners, image_to_board_matrix);
        const mmCorners = gridCorners.map(c => new Point(c.x * gridToMmScale, c.y * gridToMmScale));

        // Step 2: Calculate center in millimeters from the projected shape
        const centerMm = this._calculateCenter(mmCorners);

        // Remove sPiece calculation and h estimation
        // The markerHeight is now known directly

        if (markerHeight <= 0) { // Should not happen for chess pieces, but good for border markers
            marker.estimatedHeight = 0; // For debugging
            return; // No height, no compensation needed
        }
        marker.estimatedHeight = markerHeight; // Store known height for debugging

        // Step 3: Calculate the single correction vector in millimeter space
        const v = new Point(centerMm.x - boardCenter.x, centerMm.y - boardCenter.y);
        const alpha = markerHeight / cameraHeight; // Calculate alpha directly from known height
        const correctionVector = new Point(v.x * alpha, v.y * alpha);
        
        // Step 4: Apply the correction to all four corners in millimeter space
        const correctedMmCorners = mmCorners.map(c => new Point(c.x - correctionVector.x, c.y - correctionVector.y));

        // Step 5: Un-scale the corrected millimeter corners back to grid points
        const correctedGridCorners = correctedMmCorners.map(c => new Point(c.x / gridToMmScale, c.y / gridToMmScale));

        // Step 6: Transform the corrected grid points back to pixel coordinates
        const correctedPixelCorners = this._transformPoints(correctedGridCorners, board_to_image_matrix);

        // Step 7: Update the marker object with the fully corrected data
        if (correctedPixelCorners.length === 4) {
            marker.corners = correctedPixelCorners;
            marker.center = this._calculateCenter(correctedPixelCorners);
        }
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
}
