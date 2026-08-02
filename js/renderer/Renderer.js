export class Renderer {


    constructor(canvas) {

        this.canvas = canvas;

        this.ctx =
            canvas.getContext("2d");

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

        ctx.fillStyle = "yellow";
        ctx.font = "18px Arial";


        for (
            let i = 0;
            i < markers.count;
            i++
        ) {


            const corner =
                markers.corners.get(i);


            // --------------------------------
            // Координати 4-х кутів
            // --------------------------------

            const x0 = corner.data32F[0];
            const y0 = corner.data32F[1];

            const x1 = corner.data32F[2];
            const y1 = corner.data32F[3];

            const x2 = corner.data32F[4];
            const y2 = corner.data32F[5];

            const x3 = corner.data32F[6];
            const y3 = corner.data32F[7];


            // --------------------------------
            // Малювання рамки
            // --------------------------------

            ctx.beginPath();


            ctx.moveTo(x0, y0);

            ctx.lineTo(x1, y1);

            ctx.lineTo(x2, y2);

            ctx.lineTo(x3, y3);

            ctx.closePath();

            ctx.stroke();



            // --------------------------------
            // Центр маркера
            // --------------------------------

            const centerX =
                (x0 + x1 + x2 + x3) / 4;


            const centerY =
                (y0 + y1 + y2 + y3) / 4;



            // --------------------------------
            // ID маркера
            // --------------------------------

            let id = "?";


            if (
                markers.ids &&
                markers.ids.rows > i
            ) {

                id =
                    markers.ids.intAt(i, 0);

            }



            ctx.fillText(
                id,
                centerX,
                centerY
            );


        }


    }


}

