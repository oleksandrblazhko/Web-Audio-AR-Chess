import { OpenCvArucoDetector } from "./OpenCvArucoDetector.js";

export class DetectorFactory {

    static create(cv, objectsData) {
        return new OpenCvArucoDetector(cv, objectsData);
    }
}

