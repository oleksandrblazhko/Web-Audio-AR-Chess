Є програма для аудіо-супроводу настільної гри "Шахи".
Опис середовища:
1) по чотирьох кутах шахматної дошки розміщено ArUco-маркери
2) зверху кожної шахматної фігури розміщено Aruco-маркери
3) смартфон з камерою встановлено на підставці над поверхнею в центрі паралельно поверхні дошки
4) програма малює прямокутник, який зєднує центри чотирьох кутових маркерів
5) програма малює сітку 8x8 в межах прямокутника
6) програма малює прямокутники навколо кожного маркера фігури
7) програма контролює правильне розміщення маркерів у зонах сітки

Опис проблеми:
1) якби маркери розташовувалися не на фігурах, а на поверхні дошки, тоді їх прямокутники малюються в межах зон сітки 
2) коли фігури знаходяться ближче до центру дошки, тоді прямокутники їх маркерів малюються в межах зон сітки 
3) але, коли фігури відходять від центру дошки, тоді прямокутники їх маркерів малюються із зсувом та заходять за межі зон сітки 

# Алгоритм компенсації перспективного зміщення ArUco-маркерів шахових фігур

## 1. Мета алгоритму

Метою алгоритму є визначення правильного положення шахової фігури на площині дошки незалежно від її висоти.

Алгоритм компенсує перспективне зміщення ArUco-маркерів, що виникає через те, що маркер розташований над площиною дошки.

---

# 2. Вихідні умови

Відомо:

- висота камери над площиною дошки

  ```
  H (мм)
  ```

- відстань між центрами кутових ArUco-маркерів

  ```
  L (мм)
  ```

- фізичний розмір ArUco-маркера

  ```
  M (мм)
  ```

Наприклад

```
H = 450 мм
L = 360 мм
M = 9 мм
```

При цьому не потрібно знати:

- висоту жодної шахової фігури;
- висоту розташування маркера на фігурі;
- параметри внутрішнього калібрування камери.

---

# 3. Дані, які визначаються автоматично

Для кожного кадру OpenCV визначає:

- координати чотирьох кутових маркерів;
- координати чотирьох кутів кожного маркера;
- центр кожного маркера.

Отже додаткові вимірювання не потрібні.

---

# 4. Побудова площини дошки

За координатами чотирьох кутових маркерів будується гомографія

```
Image
    ↓
Board
```

Після цього будь-яка точка зображення може бути переведена у систему координат дошки.

Наприклад

```
(524 px, 318 px)
      ↓
(146 мм, 212 мм)
```

Надалі всі обчислення виконуються саме у координатах дошки.

---

# 5. Визначення масштабу площини

Для кожного кутового маркера визначається середня довжина його сторони

```
S1
S2
S3
S4
```

Після цього

```
Sboard = average(S1,S2,S3,S4)
```

Наприклад

```
Sboard = 52 px
```

Оскільки фізичний розмір маркера

```
M = 9 мм
```

отримуємо масштаб

```
52 px ↔ 9 мм
```

або

```
5.78 px/мм
```

---

# 6. Перетворення маркерів фігур

Для кожного маркера фігури:

1. беруться координати його чотирьох кутів;
2. усі чотири кути перетворюються гомографією у систему координат дошки.

Отримуємо

```
P0
P1
P2
P3
```

вже у міліметрах.

---

# 7. Визначення центру маркера

Обчислюється центр

```
CenterMarker
```

як середнє значення

```
P0
P1
P2
P3
```

---

# 8. Визначення видимого розміру маркера

Обчислюється середня довжина сторони

```
Spiece
```

але вже

**не у пікселях,**

а

**у міліметрах на площині дошки.**

Наприклад

```
Spiece = 9.83 мм
```

або

```
Spiece = 10.15 мм
```

---

# 9. Оцінка висоти маркера

На площині дошки маркер стає більшим, ніж його реальний розмір.

Причина —

гомографія проектує маркер, який знаходиться вище площини дошки, саме на цю площину.

Через це

```
Spiece > M
```

Відносний масштаб

```
k = Spiece / M
```

Наприклад

```
Spiece = 9.9 мм

M = 9 мм

k = 1.10
```

---

# 10. Оцінка висоти

При вертикальному положенні камери

```
k = H / (H - h)
```

де

```
h
```

— шукана висота маркера.

Звідси

```
h = H · (1 - 1/k)
```

або

```
h = H · (1 - M / Spiece)
```

Наприклад

```
H = 450 мм

M = 9 мм

Spiece = 9.90 мм
```

отримуємо

```
h = 41 мм
```

Таким чином висота визначається автоматично.

---

# 11. Визначення напрямку перспективного зміщення

Обчислюється центр дошки

```
CenterBoard
```

Далі

```
V = CenterMarker − CenterBoard
```

Цей вектор показує напрямок перспективного зміщення.

---

# 12. Компенсація координат

Обчислюється

```
α = h / H
```

Після цього

```
Corrected =
CenterMarker − α · V
```

або

```
dx = CenterMarker.x - CenterBoard.x
dy = CenterMarker.y - CenterBoard.y

Corrected.x = CenterMarker.x - dx * h / H
Corrected.y = CenterMarker.y - dy * h / H
```

Саме

```
Corrected
```

вважається положенням шахової фігури на дошці.

---

# 13. Визначення клітинки

Для визначення клітинки використовується

```
Corrected
```

а не початковий центр ArUco-маркера.

Після цього перевіряється

- чи знаходиться центр у межах потрібної клітинки;
- чи не перетинає межі сусідніх клітинок.

---

# 14. Переваги алгоритму

Потрібно виконати лише три початкові вимірювання:

- висота камери;
- відстань між кутовими маркерами;
- фізичний розмір ArUco-маркера.

Не потрібно:

- вимірювати висоту кожної шахової фігури;
- вимірювати висоту розташування кожного маркера;
- виконувати калібрування камери;
- налаштовувати різні коефіцієнти для різних типів шахових фігур.

---

# 15. Обмеження алгоритму

Алгоритм базується на таких припущеннях:

- камера встановлена майже перпендикулярно до площини дошки;
- положення камери під час роботи не змінюється;
- кутові ArUco-маркери знаходяться в одній площині;
- усі ArUco-маркери мають однаковий фізичний розмір.

При значному нахилі камери або сильній оптичній дисторсії точність оцінки висоти зменшується. У таких випадках доцільно виконати класичне калібрування камери або використовувати оцінку пози (`solvePnP` / `estimatePoseSingleMarkers`).

---

# 16. Основна перевага алгоритму

Алгоритм не використовує жодної інформації про конкретні шахові фігури.

Усі необхідні параметри визначаються автоматично із:

- чотирьох кутових ArUco-маркерів;
- геометрії шахової дошки;
- фізичного розміру ArUco-маркерів.

Це робить алгоритм універсальним для будь-якого комплекту шахових фігур, за умови використання маркерів однакового розміру.

---

# 17. Поточна реалізація

Алгоритм був реалізований шляхом оновлення кількох модулів. Основна логіка розділена між `PerspectiveCorrector` (обчислення), `OpenCvArucoDetector` (оркестрація) та `app.js` (головний цикл).

## 17.1. Конфігурація (`config.json`)

Були додані необхідні фізичні параметри.

```json
{
  "cameraWidth": 640,
  "cameraHeight": 480,
  "fps": 30,
  "markerColor": "green",
  "textColor": "green",
  "lineWidth": 3,
  "dictionary": "DICT_4X4_1000",
  "detector": "opencv",
  "gridProximityThreshold": 0.6,
  "cameraProxHeightThreshold": 0.4,
  "markerTimeoutMs": 1000,
  "emaAlpha": 0.4,
  "anyMarkerVision": false,
  "gridColor": "blue",
  "audioDirectory": "audio/",
  "safety_zone_margin_pct": 10,
  "cameraHeightCali": 330,
  "boardDimensions": 195,
  "markerSize": 10
}
```

## 17.2. Модель маркера (`js/models/Marker.js`)

Клас маркера був оновлений, щоб `center` став властивістю, що задається, а також для зберігання відлагоджувальної інформації про висоту.

```javascript
import { Point } from "./Point.js";

export class Marker {

    constructor(id = -1) {
        this.id = id;
        this.corners = [];
        this.timestamp = performance.now();
        this.center = null; // The center of the marker in PIXEL coordinates.
        this.estimatedHeight = 0; // The estimated height in mm for debugging.
    }

    addCorner(x, y) {
        this.corners.push(new Point(x, y));
    }

    calculateCenter() {
        if (this.corners.length === 0) {
            return new Point();
        }
        let x = 0;
        let y = 0;
        for (const p of this.corners) {
            x += p.x;
            y += p.y;
        }
        return new Point(x / this.corners.length, y / this.corners.length);
    }

    getPixelWidth() {
        if (this.corners.length < 4) {
            return 0;
        }
        const d1 = Math.hypot(this.corners[0].x - this.corners[1].x, this.corners[0].y - this.corners[1].y);
        const d2 = Math.hypot(this.corners[2].x - this.corners[3].x, this.corners[2].y - this.corners[3].y);
        return (d1 + d2) / 2.0;
    }
}
```

## 17.3. Інтерфейс детектора (`js/detector/ArucoDetector.js`)

Інтерфейс був розділений на два методи: `detect` для отримання необроблених даних та `correctMarkers` для застосування корекції.

```javascript
export class ArucoDetector {

    detect(frame) {
        throw new Error("detect() must be implemented.");
    }

    correctMarkers(markers, calibration) {
        throw new Error("correctMarkers() must be implemented.");
    }

}
```

## 17.4. Логіка корекції (`js/detector/PerspectiveCorrector.js`)

Цей новий модуль містить основну логіку алгоритму. Він виконує повний цикл перетворень координат для обчислення скоригованих кутів маркера.

```javascript
import { Point } from '../models/Point.js';

export class PerspectiveCorrector {
    constructor(cv) {
        this.cv = cv;
    }

    correct(markers, boardCenter, cameraHeight, markerSize, boardDimensions, image_to_board_matrix, board_to_image_matrix) {
        if (!image_to_board_matrix || image_to_board_matrix.empty() || !board_to_image_matrix || board_to_image_matrix.empty()) {
            return markers;
        }
        
        const gridToMmScale = boardDimensions / 8.0;

        for (const marker of markers) {
            // Step 1: Transform pixel corners to grid corners, then scale to millimeters
            const gridCorners = this._transformPoints(marker.corners, image_to_board_matrix);
            const mmCorners = gridCorners.map(c => new Point(c.x * gridToMmScale, c.y * gridToMmScale));

            // Step 2: Calculate center, size, and height in millimeters from the uncorrected projected shape
            const centerMm = this._calculateCenter(mmCorners);
            const sPiece = this._calculateAverageSideLength(mmCorners);

            if (sPiece < markerSize) {
                marker.estimatedHeight = 0;
                continue;
            };
            const h = cameraHeight * (1 - markerSize / sPiece);
            marker.estimatedHeight = h; // Store for debugging
            if (h <= 0) continue;

            // Step 3: Calculate the single correction vector in millimeter space
            const v = new Point(centerMm.x - boardCenter.x, centerMm.y - boardCenter.y);
            const alpha = h / cameraHeight;
            const correctionVector = new Point(v.x * alpha, v.y * alpha);
            
            // Step 4: Apply the correction to all four corners in millimeter space
            const correctedMmCorners = mmCorners.map(c => new Point(c.x - correctionVector.x, c.y - correctionVector.y));

            // Step 5: Un-scale the corrected millimeter corners back to grid points
            const correctedGridCorners = correctedMmCorners.map(c => new Point(c.x / gridToMmScale, c.y / gridToMmScale));

            // Step 6: Transform the corrected grid points back to pixel coordinates
            const correctedPixelCorners = this._transformPoints(correctedGridCorners, board_to_image_matrix);

            // Step 7: Update the marker object with the fully corrected data
            if (correctedPixelCorners.length === 4) {
                marker.corners = correctedPixelCorners;
                marker.center = this._calculateCenter(correctedPixelCorners);
            }
        }

        return markers;
    }

    _transformPoints(points, homography) {
        if (points.length === 0) {
            return [];
        }
        const src = this.cv.matFromArray(points.length, 1, this.cv.CV_32FC2, points.flatMap(p => [p.x, p.y]));
        const dst = new this.cv.Mat();
        
        this.cv.perspectiveTransform(src, dst, homography);
        
        const transformed = [];
        for (let i = 0; i < dst.rows; i++) {
            transformed.push(new Point(dst.floatAt(i, 0), dst.floatAt(i, 1)));
        }

        src.delete();
        dst.delete();
        
        return transformed;
    }

    _calculateCenter(corners) {
        if (corners.length < 4) return new Point();
        let x = 0;
        let y = 0;
        for (const p of corners) {
            x += p.x;
            y += p.y;
        }
        return new Point(x / 4, y / 4);
    }

    _calculateAverageSideLength(corners) {
        const dist = (p1, p2) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
        
        const side1 = dist(corners[0], corners[1]);
        const side2 = dist(corners[1], corners[2]);
        const side3 = dist(corners[2], corners[3]);
        const side4 = dist(corners[3], corners[0]);
        
        return (side1 + side2 + side3 + side4) / 4;
    }
}
```

## 17.5. Реалізація детектора (`js/detector/OpenCvArucoDetector.js`)

Цей клас тепер реалізує `detect` для отримання необроблених даних та `correctMarkers` для виклику логіки корекції.

```javascript
import { Marker } from "../models/Marker.js";
import { Point } from "../models/Point.js";
import { PerspectiveCorrector } from "./PerspectiveCorrector.js";
import { Config } from "../config/config.js";

export class OpenCvArucoDetector {
    constructor(cv) {
        this.cv = cv;
        // ... (detector setup)
        this.perspectiveCorrector = new PerspectiveCorrector(cv);
    }

    detect(frame) {
        // ... (detection logic)
        const markerList = []; // Fills with raw markers
        // ...
        return markerList;
    }

    correctMarkers(markers, calibration) {
        if (!calibration || 
            !calibration.image_to_board_matrix || calibration.image_to_board_matrix.empty() ||
            !calibration.board_to_image_matrix || calibration.board_to_image_matrix.empty()
            ) {
            return; // No correction possible
        }
            
        const boardDimensions = Config.boardDimensions;
        const boardCenter = new Point(boardDimensions / 2, boardDimensions / 2);

        // Ensure matrices are 32F
        const image_to_board_32f = new this.cv.Mat();
        const board_to_image_32f = new this.cv.Mat();
        calibration.image_to_board_matrix.convertTo(image_to_board_32f, this.cv.CV_32F);
        calibration.board_to_image_matrix.convertTo(board_to_image_32f, this.cv.CV_32F);

        // This method will now modify the markers in the list directly
        this.perspectiveCorrector.correct(
            markers,
            boardCenter,
            Config.cameraHeightCali,
            Config.markerSize,
            boardDimensions,
            image_to_board_32f,
            board_to_image_32f
        );

        // Cleanup
        image_to_board_32f.delete();
        board_to_image_32f.delete();
    }
}
```

## 17.6. Головний цикл (`js/app.js`)

Головний цикл був оновлений для правильного порядку операцій: виявлення, згладжування (EMA), а потім корекція.

```javascript
function loop() {
    if (video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
        const frameCanvas = frameProvider.getFrame();
        const mat = frameConverter.convert(frameCanvas);
        const now = performance.now();
        
        // --- Step 1: Detect raw markers ---
        const detectedMarkers = detector.detect(mat);

        // --- Step 2: Update visible markers list and apply EMA smoothing ---
        for (const marker of detectedMarkers) {
            marker.timestamp = now;

            if (!markerFilters[marker.id]) {
                markerFilters[marker.id] = marker.corners.map(c => new Point(c.x, c.y));
            } else {
                const prevCorners = markerFilters[marker.id];
                for (let j = 0; j < 4; j++) {
                    prevCorners[j].x = Config.emaAlpha * marker.corners[j].x + (1.0 - Config.emaAlpha) * prevCorners[j].x;
                    prevCorners[j].y = Config.emaAlpha * marker.corners[j].y + (1.0 - Config.emaAlpha) * prevCorners[j].y;
                }
                marker.corners = prevCorners;
                marker.center = marker.calculateCenter();
            }
            visibleMarkers[marker.id] = marker;
        }

        // --- Step 3: Clean up stale markers ---
        for (const id in visibleMarkers) {
            // ...
        }
        
        // --- Step 4: Apply perspective correction (modifies markers in place) ---
        const markersToProcess = Object.values(visibleMarkers);
        detector.correctMarkers(markersToProcess, calibration);

        // --- Step 5: Update calibration logic ---
        // ...

        // --- Step 6: Proximity checks ---
        // ...

        // --- Step 7: Rendering ---
        // ...
        
        mat.delete();
    }
    
    requestAnimationFrame(loop);
}
```

---
# 18. Опис невирішеної проблеми

Незважаючи на реалізацію та виправлення, алгоритм працює не зовсім коректно. Основна проблема полягає у **недостатній величині зсуву (корекції)**.

## Спостереження

1.  **Тестовий випадок:** Використовується фігура висотою приблизно `70-75 мм`. Камера та дошка налаштовані згідно з `config.json`.
2.  **Поведінка в центрі:** Коли фігура знаходиться в центрі дошки, її положення визначається правильно.
3.  **Поведінка на краю:** Коли фігура переміщується до краю дошки (наприклад, на відстань ~50 мм від центру), візуальна корекція відбувається, але вона занадто мала.
    *   **Очікуваний зсув:** ~15 мм.
    *   **Фактичний зсув:** ~5 мм.

## Аналіз

Проблема зводиться до того, що алгоритм значно **занижує оцінку висоти (`h`)** маркера.

За допомогою відлагоджувального виводу було встановлено:
- Для фігури фактичною висотою `~70 мм`, що стоїть **у центрі**, алгоритм розраховує висоту `h` близько **12 мм**.
- Для тієї ж фігури, що стоїть **на краю** дошки, розрахована висота `h` збільшується до **25 мм**.

Це вказує на дві проблеми:
1.  **Систематичне заниження висоти:** Розраховане значення `h` в 3-4 рази менше за реальне.
2.  **Нестабільність розрахунку:** Оцінка висоти залежить від положення маркера на дошці, хоча в ідеальній моделі вона має бути постійною.

**Ймовірна причина:**
Основна формула `h = H · (1 - M / Spiece)` дуже чутлива до значення `Spiece` (видимий розмір маркера на площині дошки). Залежність `h` від положення маркера свідчить про те, що розрахунок `Spiece` не є стабільним. Це, найімовірніше, пов'язано з **оптичною дисторсією об'єктива камери**, яку не враховує поточна модель гомографії. Гомографія добре виправляє перспективу для площини дошки, але некоректно обробляє проекцію об'єктів, що знаходяться *над* цією площиною, особливо біля країв зображення. В результаті `Spiece` обчислюється неправильно, що призводить до невірної оцінки `h` і, як наслідок, до недостатньої корекції.