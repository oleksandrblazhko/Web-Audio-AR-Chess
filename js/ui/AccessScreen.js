export class AccessScreen {

    constructor() {

        this.overlay =
            document.createElement("div");


        this.overlay.style.position = "fixed";
        this.overlay.style.left = "0";
        this.overlay.style.top = "0";
        this.overlay.style.width = "100%";
        this.overlay.style.height = "100%";

        this.overlay.style.background = "#000";

        this.overlay.style.display = "flex";
        this.overlay.style.justifyContent = "center";
        this.overlay.style.alignItems = "center";

        this.overlay.style.zIndex = "1000";

        this.overlay.style.cursor = "pointer";


        const text =
            document.createElement("div");


        text.innerHTML =
            "Натисніть на екран<br>для запуску камери";


        text.style.color = "white";

        text.style.fontFamily = "Arial";

        text.style.fontSize = "26px";

        text.style.textAlign = "center";

        text.style.lineHeight = "1.5";


        this.overlay.appendChild(text);

    }


    async waitForClick() {

        document.body.appendChild(
            this.overlay
        );


        return new Promise(resolve => {

            this.overlay.addEventListener(
                "click",
                () => {

                    this.overlay.remove();

                    resolve();

                },
                {
                    once: true
                }
            );

        });

    }

}

