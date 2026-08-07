async function waitOpenCV() {

    return new Promise(resolve => {

        if (cv instanceof Promise) {

            cv.then(realCv => {

                window.cv = realCv;
                resolve(realCv);

            });

        }
        else if (cv.getBuildInformation === undefined) {

            cv.onRuntimeInitialized = () => resolve(cv);

        }
        else {

            resolve(cv);

        }

    });

}


(async()=>{


const cv = await waitOpenCV();


const log =
document.getElementById("log");


const video =
document.getElementById("video");


const canvas =
document.getElementById("canvas");


const ctx =
canvas.getContext("2d");



canvas.width = 640;
canvas.height = 480;



log.textContent =
"OpenCV loaded\n\n";



//
// Camera
//

const stream =
await navigator.mediaDevices.getUserMedia({

    video:{
        width:640,
        height:480
    }

});


video.srcObject = stream;

await video.play();




//
// Dictionary
//

const dictionary =
cv.getPredefinedDictionary(
    cv.DICT_4X4_1000
);



//
// Detector
//

const detector =
new cv.aruco_ArucoDetector(

    dictionary,

    new cv.aruco_DetectorParameters(),

    new cv.aruco_RefineParameters(
        10,
        3,
        true
    )

);




//
// Camera matrix
//

const cameraMatrix =
cv.matFromArray(

3,
3,
cv.CV_64F,

[

808.32168,0,320.01007,

0,806.84725,249.24376,

0,0,1

]

);




//
// Distortion
//

const distCoeffs =
cv.matFromArray(

5,
1,
cv.CV_64F,

[

0.012828,
0.7328479,
-0.0015755,
0.0001273,
-2.4525928

]

);





//
// Marker size
// 9 mm
//

const markerSize = 9;

const h =
markerSize / 2;



const objectPoints =
cv.matFromArray(

4,
1,
cv.CV_32FC3,

[

-h,-h,0,

 h,-h,0,

 h, h,0,

-h, h,0

]

);






function processFrame(){


    ctx.drawImage(

        video,

        0,
        0,
        canvas.width,
        canvas.height

    );


    const frame =
    cv.imread(canvas);



    detect(frame);



    frame.delete();



    requestAnimationFrame(
        processFrame
    );


}






function detect(frame){



    const corners =
    new cv.MatVector();


    const ids =
    new cv.Mat();



    detector.detectMarkers(

        frame,

        corners,

        ids

    );



    if(ids.rows > 0){



        const id =
        ids.data[0];



        const imagePoints =
        corners.get(0);



        drawMarker(
            imagePoints,
            id
        );



        solvePose(

            imagePoints,

            id

        );



        imagePoints.delete();


    }



    corners.delete();
    ids.delete();



}







function drawMarker(points,id){



    const p=[];



    for(let i=0;i<4;i++){


        p.push({

            x:points.data32F[i*2],

            y:points.data32F[i*2+1]

        });


    }




    ctx.strokeStyle="lime";

    ctx.lineWidth=2;


    ctx.beginPath();


    ctx.moveTo(
        p[0].x,
        p[0].y
    );


    for(let i=1;i<4;i++){


        ctx.lineTo(
            p[i].x,
            p[i].y
        );


    }


    ctx.closePath();

    ctx.stroke();




    ctx.fillStyle="yellow";

    ctx.font="18px monospace";


    ctx.fillText(

        "ID="+id,

        p[0].x,

        p[0].y-10

    );


}








function solvePose(
    imagePoints,
    id
){



    const rvec =
    new cv.Mat();


    const tvec =
    new cv.Mat();



    const ok =
    cv.solvePnP(

        objectPoints,

        imagePoints,

        cameraMatrix,

        distCoeffs,

        rvec,

        tvec

    );




    if(ok){



        drawAxis(
            rvec,
            tvec
        );



        ctx.fillStyle="white";

        ctx.font="16px monospace";



        ctx.fillText(

            "ID="+id,

            10,
            25

        );



        ctx.fillText(

            "Z="+
            tvec.data64F[2].toFixed(1)
            +" mm",

            10,
            45

        );



        log.textContent =

        "ID = "+id+"\n\n"+

        "rvec:\n"+

        Array.from(
            rvec.data64F
        )
        .map(
            x=>x.toFixed(5)
        )
        .join(", ")
        +"\n\n"+


        "tvec:\n"+

        Array.from(
            tvec.data64F
        )
        .map(
            x=>x.toFixed(2)
        )
        .join(", ");



    }



    rvec.delete();

    tvec.delete();



}









function drawAxis(rvec,tvec){



    const axisPoints =
    cv.matFromArray(

        4,
        1,
        cv.CV_32FC3,

        [

            0,0,0,

            30,0,0,

            0,30,0,

            0,0,30

        ]

    );



    const projected =
    new cv.Mat();



    cv.projectPoints(

        axisPoints,

        rvec,

        tvec,

        cameraMatrix,

        distCoeffs,

        projected

    );



    const p=[];



    for(let i=0;i<4;i++){


        p.push({

            x:projected.data32F[i*2],

            y:projected.data32F[i*2+1]

        });


    }




    function line(a,b,color){


        ctx.strokeStyle=color;

        ctx.lineWidth=3;


        ctx.beginPath();


        ctx.moveTo(
            p[a].x,
            p[a].y
        );


        ctx.lineTo(
            p[b].x,
            p[b].y
        );


        ctx.stroke();


    }



    // X
    line(0,1,"red");


    // Y
    line(0,2,"lime");


    // Z
    line(0,3,"cyan");




    axisPoints.delete();

    projected.delete();



}





processFrame();



})();
