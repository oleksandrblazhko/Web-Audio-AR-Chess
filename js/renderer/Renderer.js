export class Renderer {

    constructor(canvas) {

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

    }

    resize(width, height) {

        this.canvas.width = width;
        this.canvas.height = height;

    }

    clear() {

        this.ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

    }

    drawVideo(video) {

        this.ctx.drawImage(
            video,
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

    }

}