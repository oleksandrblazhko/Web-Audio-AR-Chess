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

        ctx.font = "17px Arial";
        ctx.fillStyle = "yellow";


        for (
            let i = 0;
            i < markers.count;
            i++
        ) {


            const corner =
                markers.corners.get(i);


            // ----------------------------
            // 1. Малювання рамки
            // ----------------------------

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



            // ----------------------------
            // 2. Виведення ID маркера
            // ----------------------------

            if (
                markers.ids &&
                markers.ids.rows > i
            ) {


                const id =
                    markers.ids.data[i];


                const x =
                    corner.data32F[0];


                const y =
                    corner.data32F[1];


                ctx.fillText(
                    id,
                    x + 10,
                    y - 10
                );

            }

        }

    }


}

