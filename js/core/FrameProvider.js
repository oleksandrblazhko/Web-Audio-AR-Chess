export class FrameProvider {

    constructor(video) {

        this.video = video;

        this.canvas =
            document.createElement("canvas");

        this.context =
            this.canvas.getContext("2d");

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

        return this.canvas;

    }

}
