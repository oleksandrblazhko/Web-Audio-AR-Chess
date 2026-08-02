export class Frame {

    constructor(imageData) {

        this.imageData = imageData;

        this.width = imageData.width;
        this.height = imageData.height;

        this.timestamp = performance.now();

    }

}

