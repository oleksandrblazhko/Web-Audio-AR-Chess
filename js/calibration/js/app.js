import {CalibrationEstimator}
from "./CalibrationEstimator.js";

import {CameraParameters}
from "./CameraParameters.js";

const estimator =
    new CalibrationEstimator(
        360,
        450
    );

const camera =
    new CameraParameters();

const result =
    estimator.estimate(

        507,

        513,

        640,

        480

    );

camera.cameraMatrix =
    result.cameraMatrix;

document
.getElementById("log")
.textContent=

JSON.stringify(
    camera.cameraMatrix,
    null,
    4
);

document
.getElementById("saveButton")
.onclick=
()=>
camera.save();

