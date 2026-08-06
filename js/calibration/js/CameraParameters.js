export class CameraParameters
{

    constructor()
    {

        this.cameraMatrix = null;

        this.distCoeffs =
        [
            0,
            0,
            0,
            0,
            0
        ];

    }

    save(filename="camera.json")
    {

        const data =
        {

            cameraMatrix:this.cameraMatrix,

            distCoeffs:this.distCoeffs

        };

        const blob =
            new Blob(
                [
                    JSON.stringify(
                        data,
                        null,
                        4
                    )
                ],
                {
                    type:"application/json"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const a =
            document.createElement("a");

        a.href=url;

        a.download=filename;

        a.click();

        URL.revokeObjectURL(url);

    }

}
