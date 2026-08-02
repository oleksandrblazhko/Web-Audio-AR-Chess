import {Config} from "../config/config.js";

import {Logger} from "../utils/logger.js";

export class CameraManager{

    constructor(video){

        this.video=video;

    }

    async start(){

        const stream=await navigator.mediaDevices.getUserMedia({

            video:{

                width:Config.cameraWidth,

                height:Config.cameraHeight,

                facingMode:"environment"

            }

        });

        this.video.srcObject=stream;

        await this.video.play();

        Logger.info("Camera started");

    }

}
