export class ArucoDetector {

    detect(frame) {
        throw new Error("detect() must be implemented.");
    }

    correctMarkers(markers, calibration, objectsData) {
        throw new Error("correctMarkers() must be implemented.");
    }

}
