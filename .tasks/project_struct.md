Оновлена структура проекту та дерево викликів функцій
Оновлено 2026-08-29 на основі аналізу вихідного коду з інтеграцією BoardStateManager.
Точка входу: index.html → js/app.js (ES-модуль із top-level await).

1. Каталог проекту (код)
text
Web-Audio-AR-Chess/
├── index.html                  ← завантажує OpenCV + js/app.js; містить <video> і <canvas>
├── config.json                 ← зовнішні налаштування (перевизначають Config)
├── objects.json                ← визначення маркерів (obj_id, marker_id, color, audio_name, marker_height…)
├── objects_marker_12mm.json    ← альтернативний набір маркерів (12 мм), у коді не підключений
├── css/main.css
├── audio/                      ← mp3-файли фігур (tura, kin, slon, korol, koroleva, pishak)
├── libs/opencv/                ← opencv-4.14.js (активний), opencv-4.10.js (запасний)
└── js/
    ├── app.js                  ← ініціалізація, завантаження конфігів, головний цикл loop()
    ├── config/config.js        ← дефолти Config
    ├── camera/CameraManager.js      ← getUserMedia + video.play()
    ├── core/FrameProvider.js        ← video → прихований canvas (кадр)
    ├── core/Calibration.js          ← збір кутових маркерів, гомографії, projectToGrid/Image
    ├── core/BoardStateManager.js    ← NEW: зберігання позицій фігур, шахова нотація, FEN
    ├── core/cvLoader.js             ← legacy: очікування cv.onRuntimeInitialized (ніким не викликається)
    ├── opencv/OpenCvLoader.js       ← wait for window.cv → об'єкт cv
    ├── opencv/OpenCvFrameConverter.js ← cv.imread(canvas) → cv.Mat
    ├── detector/DetectorFactory.js  ← створює OpenCvArucoDetector
    ├── detector/OpenCvArucoDetector.js ← detectMarkers + виклик коректора
    ├── detector/ArucoDetector.js    ← базовий абстрактний клас (unused у рантаймі)
    ├── detector/PerspectiveCorrector.js ← корекція перспективи + snapping до клітинки
    ├── detector/ProximityDetector.js    ← логіка близькості (камера / контрольний маркер)
    ├── renderer/Renderer.js         ← усе малювання на canvas + drawBoardState
    ├── audio/WebAudioManager.js     ← звуки, beeps, loop-відтворення
    ├── ui/AccessScreen.js           ← оверлей «Натисніть для запуску камери»
    ├── models/ (Point, Marker, MarkerCollection, MarkerDetection, Frame)
    └── utils/logger.js              ← Logger.info/error (використовується лише CameraManager)
2. Старт застосунку (одноразові виклики)
text
index.html
└── <script src="libs/opencv/opencv-4.14.js">        ← готує window.cv (Promise)
└── <script type="module" src="js/app.js">
    │
    ├── OpenCvLoader.waitForOpenCV()                  [js/app.js:25]
    │
    ├── Створення модулів                             [js/app.js:30-39]
    │   ├── DetectorFactory.create(cv)
    │   │   └── new OpenCvArucoDetector(cv)
    │   │       ├── cv.getPredefinedDictionary(DICT_4X4_1000)
    │   │       ├── new cv.aruco_DetectorParameters()
    │   │       ├── new cv.aruco_RefineParameters(10.0, 3.0, false)
    │   │       ├── new cv.aruco_ArucoDetector(...)
    │   │       └── new PerspectiveCorrector(cv)
    │   ├── new CameraManager(video)
    │   ├── new Renderer(canvas)                      → canvas.getContext("2d")
    │   ├── new FrameProvider(video)                  → document.createElement("canvas")
    │   ├── new OpenCvFrameConverter(cv)
    │   ├── new AccessScreen()
    │   ├── new Calibration(cv)
    │   ├── new WebAudioManager(Config.audioDirectory)
    │   ├── new ProximityDetector(audioManager, 500)
    │   └── new BoardStateManager()                   ← NEW: ініціалізація стану дошки
    │
    ├── accessScreen.waitForClick()                   ← blocking: чекає кліку по оверлею
    │
    └── start()                                       [js/app.js:293]
        ├── loadConfigurations()                      [js/app.js:50]
        │   ├── fetch("config.json") → Object.assign(Config, externalConfig)
        │   │   ├── safetyZoneMarginPct = safety_zone_margin_pct
        │   │   └── audioManager.audioBaseDir = Config.audioDirectory
        │   └── fetch("objects.json")
        │       └── for (obj of config.objects)
        │           ├── objectsData[obj.marker_id] = obj
        │           ├── obj_type === "border"  → borderIds[] → Config.boundaryIds
        │           └── obj_type === "control" → controlId   → Config.controlMarkerId
        ├── camera.start()
        │   ├── navigator.mediaDevices.getUserMedia({video: {w, h, facingMode}})
        │   ├── video.srcObject = stream; await video.play()
        │   └── Logger.info("Camera started")
        ├── renderer.resize(w, h)                     ← canvas.width/height
        ├── frameProvider.resize(w, h)                ← canvas.width/height
        ├── createControlPanel()                      [js/app.js:113]
        │   ├── calibBtn.onclick → calibration.start()
        │   │                  └→ audioManager.playCalibrationBeeps()
        │   ├── mirrorBtn.onclick → mirrorEnabled = !mirrorEnabled
        │   ├── zoneBtn.onclick   → showOptimalZone = !showOptimalZone
        │   └── boardBtn.onclick  → showBoardState = !showBoardState  ← NEW
        │                         └→ console.log стану дошки + FEN
        └── requestAnimationFrame(loop)
3. Головний цикл обробки кадру (виконується щоразово, ~30–60 fps)
text
loop()                                              [js/app.js:311]
├── frameProvider.getFrame()                        ← video → frameCanvas (2D context.drawImage)
├── frameConverter.convert(frameCanvas)             ← cv.imread() → cv.Mat (RGBA)
│
├── Step 1: detector.detect(mat)                    [OpenCvArucoDetector.js:21]
│   ├── cv.cvtColor(frame, gray, COLOR_RGBA2GRAY)
│   ├── this.detector.detectMarkers(gray, corners, ids, rejected)
│   ├── for (кожен знайдений id):
│   │   ├── new Marker(id) → marker.addCorner(×4)
│   │   ├── marker.calculateCenter()
│   │   └── marker.correctedCorners / correctedCenter = копія сирих даних
│   └── mat.delete() для всіх cv-об'єктів
│
├── Step 2: EMA-згладжування (вбудовано в app.js)   [js/app.js:320-341]
│   ├── уперше бачимо → markerFilters[id] = corners.clone
│   └── далі → corners[j] = emaAlpha·now + (1−emaAlpha)·prev; marker.center = calculateCenter()
│   → visibleMarkers[id] = marker
│
├── Step 3: видалення «протермінованих» маркерів    [js/app.js:343-349]
│   └── now − timestamp > Config.markerTimeoutMs → delete visibleMarkers[id], markerFilters[id]
│
├── Step 4: detector.correctMarkers(markers, calibration, objectsData)
│   │                                                 [OpenCvArucoDetector.js:59]
│   ├── перевірка: обидві гомографії існують (інакше return)
│   ├── convertTo(CV_32F) обох матриць
│   └── PerspectiveCorrector.correct(...)            [PerspectiveCorrector.js:8]
│       └── for (кожен marker):
│           ├── _transformPoints(corners, image_to_board) → mm-координати
│           ├── _calculateCenter / _calculateAverageSideLength
│           ├── h = objectsData[id].marker_height    ← задана висота
│           │     інакше h = cameraHeight·(1 − markerSize/sPiece)  ← динамічна оцінка
│           ├── marker.estimatedHeight = h; if (h ≤ 0) continue   ← border/control пропуск
│           ├── корекція viniesення: v·(h/cameraHeight) для 4 кутів
│           ├── _transformPoints(correctedGrid, board_to_image) → пікселі
│           └── SNAPPING: Math.floor(gridCenter) → центр клітинки (col+0.5, row+0.5)
│                 → зсув усіх кутів на (dx, dy)
│
├── Step 5: calibration.update() — тільки під час калібрування
│   │                                                 [app.js:357-359 → Calibration.js:37]
│   ├── збір center/getPixelWidth() по boundaryIds щоразово
│   └── elapsed > 3000 мс → Calibration.finish(boundaryIds)
│       ├── середні центри + ширина 4 кутових маркерів
│       ├── сортування кутів за кутом від центроїда (TL,TR,BR,BL)
│       ├── pCalib = середня піксельна ширина
│       └── cv.getPerspectiveTransform() ×2
│           → board_to_image_matrix, image_to_board_matrix
│
├── Step 5.5: updateBoardState(markers, calibration)   ← NEW [app.js:85-119]
│   │                                                 [app.js:361-363]
│   ├── перевірка: calibration.tableZone.length === 4 && !isCalibrating
│   ├── видалення зниклих маркерів з boardState
│   │   └── boardState.removeMarker(id) для неактивних
│   └── для кожного активного маркера:
│       ├── пропуск border/control маркерів
│       ├── calibration.projectToGrid(correctedCenter)
│       ├── Math.floor(gridPt.x/y) → gridX, gridY
│       ├── перевірка меж дошки (0-7)
│       ├── boardState.updateMarkerPosition(id, gridX, gridY, objData)
│       │   ├── gridToCell() → шахова нотація ("e4", "d5"...)
│       │   ├── виявлення переміщень (попередня клітинка ≠ нова)
│       │   │   └── moveHistory.push({from, to, timestamp...})
│       │   └── оновлення boardState та markerToCell
│       └── логування переміщень у консоль
│
├── Step 6: перевірка близькості
│   ├── proximityDetector.checkCameraProximity(...)  [ProximityDetector.js:14]
│   │   ├── hRel = 1 − pCalib / marker.getPixelWidth()
│   │   ├── hRel > cameraProxHeightThreshold
│   │   │   └── audioManager.playCameraProxSound(id, objDef.audio_name)
│   │   └── віддалилися (> gracePeriodMs) → audioManager.stopCameraProxSound(id)
│   └── proximityDetector.checkControlMarkerProximity(controlMarker, ...)
│       │                                             [ProximityDetector.js:49]
│       ├── calibration.projectToGrid(controlMarker.center) → homography (data64F)
│       ├── Крок 1: є блокування → згладжена відстань (5 значень)
│       │   ├── < threshold·1.5 (гістерезис) → audioManager.playLoopingSound(audioName)
│       │   └── ≥ → зняти lockedObjectState
│       ├── Крок 2: немає блокування → пошук найближчої фігури (< gridProximityThreshold)
│       │   └── lockedObjectState = {...}; audioManager.playLoopingSound(...)
│       └── Крок 3: таймаут gracePeriodMs → audioManager.stopLoopingSound()
│
└── Step 7: рендер                                    [js/app.js:374-416]
    ├── markersToRender = фільтр (anyMarkerVision || objectsData[id])
    ├── renderer.clear()
    ├── renderer.ctx.drawImage(frameCanvas)           ← + mirror-трансформація, якщо увімкнено
    ├── renderer.drawBoundary(calibration)            ← червоний 4-кутник tableZone
    ├── renderer.drawTableGrid(calibration, gridColor)
    │   └── 9+9 ліній: projectToImage(Point 0..8) → lineTo/stroke
    ├── renderer.drawMarkers(markersToRender, textColor)
    │   ├── зелена рамка по 4 кутах (сирі corners)
    │   ├── жовта рамка по correctedCorners (якщо estimatedHeight > 0)
    │   └── підпис ID + «h: Xmm» (оранжевий)
    ├── renderer.drawProjectedMarkers(markers, calibration, objectsData)
    │   └── для спроєктованих на сітку: коло r=6, fillStyle = obj.color ?? 'blue'
    ├── renderer.drawBoardState(boardState, calibration)  ← NEW: якщо showBoardState
    │   └── для кожної фігури: малює type та клітинку біля позиції
    ├── renderer.drawOptimalZone(marginPct)           ← якщо showOptimalZone
    ├── renderer.drawUIInfo(...)                      ← статусні рядки:
    │   ├── «Калібрування...» / «Калібрування не виконано»
    │   └── «Маркер керування: ВИДИМИЙ/НЕВИДИМИЙ» (решта тексту закоментована)
    └── mat.delete()                                  ← освободить cv.Mat кадру
4. Ключові об'єкти даних та їхні власники
Об'єкт	Створюється / модифікується	Споживається
visibleMarkers (id → Marker)	loop() Steps 1–4	Calibration, ProximityDetector, Renderer, BoardStateManager
markerFilters (EMA-стан)	loop() Step 2	loop()
objectsData (marker_id → об'єкт з JSON)	loadConfigurations()	PerspectiveCorrector (marker_height), ProximityDetector (audio_name, obj_type), Renderer (color), BoardStateManager
calibration.*_matrix (гомографії)	Calibration.finish()	OpenCvArucoDetector, PerspectiveCorrector, ProximityDetector, Renderer, BoardStateManager
closestDistance	checkControlMarkerProximity()	drawUIInfo() (лише для прихованих рядків)
boardState.boardState (клітинка → фігура)	updateBoardState() → BoardStateManager.updateMarkerPosition()	Renderer.drawBoardState(), BoardStateManager.getFEN()
boardState.markerToCell (markerId → клітинка)	updateBoardState()	Виявлення переміщень, видалення маркерів
boardState.moveHistory	BoardStateManager.updateMarkerPosition()	Аналіз гри, відкат ходів
5. Виклики, що не беруть участі в активному рантаймі
ArucoDetector (js/detector/ArucoDetector.js) — абстрактна база, жодного наслідування у коді.

CvLoader (js/core/cvLoader.js) — стара заміна OpenCvLoader.waitForOpenCV(), ніким не імпортується.

Frame, MarkerCollection, MarkerDetection (js/models/) — імпортованими модулями не використовуються.

WebAudioManager.stopAllSounds(), playBeep() поза calibration-beeps прямих викликів з loop() не мають.

objects_marker_12mm.json, libs/opencv/opencv-4.10.js, utils/* — не підключені до index.html/app.js.

BoardStateManager.cellToGrid() — не використовується в поточній версії (зарезервовано для майбутнього).

6. Нові можливості з BoardStateManager
Зберігання позицій:
boardState (Map): клітинка ("e4") → інформація про фігуру

markerToCell (Map): ID маркера → клітинка

moveHistory (Array): історія всіх ходів

Шахова нотація:
Конвертація координат сітки (0-7) → шахова нотація ("a1"-"h8")

Підтримка орієнтації дошки (white/black perspective)

Виявлення ходів:
Автоматичне визначення переміщень фігур

Логування в консоль при зміні позиції

Експорт FEN:
Генерація FEN-рядка для інтеграції з шаховими рушіями

Можливість збереження та аналізу позицій

Візуалізація:
Кнопка "Дошка" для перемикання відображення

Виведення типу фігури та клітинки на canvas

Консольний вивід для налагодження

