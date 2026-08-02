export class OpenCvFrameConverter {

    constructor(cv) {

        this.cv = cv;

    }


    convert(canvas) {

        return this.cv.imread(canvas);

    }

}

