export const Config = {
    cameraWidth: 640,
    cameraHeight: 480,
    fps: 30,
    markerColor: "#00FF00",
    textColor: "#00FF00",
    lineWidth: 3,
    dictionary: "DICT_4X4_1000",
    detector: "opencv",

    // Нові відносні параметри для смартфонів:
    boundaryIds: [145, 110, 425, 468],
    boundaryCorners: {},           // markerId -> name кутового маркера (з objects.json)
    controlMarkerId: 85,
    gridProximityThreshold: 0.6,    // Поріг наближення на дошці (в одиницях сітки 0-8)
    cameraProxHeightThreshold: 0.4, // Поріг наближення до камери (відносна висота підняття 0.0..1.0)
    markerTimeoutMs: 1000,          // Час зникнення маркера в мілісекундах
    emaAlpha: 0.4,                  // Параметр EMA фільтра для згладжування (0.0..1.0)
    audioDirectory: "audio/",
    cameraHeightCali: 450,
    boardDimensions: 360,
    markerSize: 9
};

