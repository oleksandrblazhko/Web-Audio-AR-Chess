export class OpenCvFrameConverter {


    constructor(cv) {

        this.cv = cv;

    }


    convert(frame) {

        return this.cv.matFromImageData(
            frame.imageData
        );

    }

}

