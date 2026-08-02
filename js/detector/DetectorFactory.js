import { Config } from "../config/config.js";
import { OpenCvArucoDetector } from "./OpenCvArucoDetector.js";

export class DetectorFactory {

    static create() {

        switch (Config.detector) {

            case "opencv":
                return new OpenCvArucoDetector();

            default:
                throw new Error("Unknown detector");

        }

    }

}

