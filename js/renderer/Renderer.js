export class Renderer {

    constructor(canvas) {

        this.canvas = canvas;

        this.ctx =
            canvas.getContext("2d");

    }


    resize(width,height) {

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


    drawMarkers(markers) {


        if (
            !markers ||
            markers.count === 0
        ) {

            return;

        }


        const ctx = this.ctx;


        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;


        for (
            let i = 0;
            i < markers.count;
            i++
        ) {


            const corner =
                markers.corners.get(i);


            ctx.beginPath();


            ctx.moveTo(
                corner.data32F[0],
                corner.data32F[1]
            );


            for (
                let j = 1;
                j < 4;
                j++
            ) {

                ctx.lineTo(
                    corner.data32F[j * 2],
                    corner.data32F[j * 2 + 1]
                );

            }


            ctx.closePath();

            ctx.stroke();

        }

    }

}

