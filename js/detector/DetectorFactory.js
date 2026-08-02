import { OpenCvArucoDetector } from "./OpenCvArucoDetector.js";


export class DetectorFactory {


    static create(cv) {

        return new OpenCvArucoDetector(cv);

    }

}

