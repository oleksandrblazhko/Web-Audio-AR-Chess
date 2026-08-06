export class CalibrationEstimator
{

    constructor(
        boardSizeMm,
        cameraHeightMm
    )
    {

        this.boardSizeMm =
            boardSizeMm;

        this.cameraHeightMm =
            cameraHeightMm;

    }

    estimate(
        widthPixels,
        heightPixels,
        imageWidth,
        imageHeight
    )
    {

        const fx =
            widthPixels
            *
            this.cameraHeightMm
            /
            this.boardSizeMm;

        const fy =
            heightPixels
            *
            this.cameraHeightMm
            /
            this.boardSizeMm;

        return {

            cameraMatrix:
            [

                [
                    fx,
                    0,
                    imageWidth/2
                ],

                [
                    0,
                    fy,
                    imageHeight/2
                ],

                [
                    0,
                    0,
                    1
                ]

            ]

        };

    }

}
