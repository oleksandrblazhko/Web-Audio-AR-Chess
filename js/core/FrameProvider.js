import { Frame } from "../models/Frame.js";

export class FrameProvider {

    constructor(video) {

        this.video = video;

        this.canvas = document.createElement("canvas");
        // this.context = this.canvas.getContext("2d");
        this.context = this.canvas.getContext("2d",{willReadFrequently: true}
);

    }

    resize(width, height) {

        this.canvas.width = width;
        this.canvas.height = height;

    }

    getFrame() {

        this.context.drawImage(
            this.video,
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
/*
        const pixel = this.context.getImageData(
            10,
            10,
            1,
            1
        ).data;

        console.log(
            "Pixel:",
            pixel[0],
            pixel[1],
            pixel[2],
            pixel[3]
        );
*/
        const imageData = this.context.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height
    );

    return new Frame(imageData);

    }

}

