import { ArucoDetector } from "./ArucoDetector.js";
import { MarkerCollection } from "../models/MarkerCollection.js";

export class OpenCvArucoDetector extends ArucoDetector {

    detect(frame) {

        return new MarkerCollection();

    }

}
