# Рекомендації щодо використання OpenCV.js 5.0

## Важливі особливості OpenCV 5

На відміну від OpenCV 4, у OpenCV 5 об'єкт `cv` може бути **Promise**.

Тому перед використанням бібліотеки необхідно виконати її ініціалізацію.

---

## Універсальний OpenCvLoader

```javascript
export class OpenCvLoader {

    static async load() {

        // OpenCV 5 (cv є Promise)
        if (cv instanceof Promise) {
            return await cv;
        }

        // OpenCV 4 (вже ініціалізовано)
        if (cv.getBuildInformation !== undefined) {
            return cv;
        }

        // OpenCV 4 (ініціалізація ще триває)
        return new Promise(resolve => {
            cv.onRuntimeInitialized = () => resolve(cv);
        });
    }

}
```

---

## Використання у app.js

```javascript
import { OpenCvLoader } from "./opencv/OpenCvLoader.js";

const cv = await OpenCvLoader.load();

console.log(cv.getBuildInformation());

// Подальша ініціалізація програми...
```

---

## Якщо використовується Promise

Можна також використовувати безпосередньо:

```javascript
cv.then((ready_cv) => {

    cv = ready_cv;

    console.log(cv.getBuildInformation());

});
```

або

```javascript
(async () => {

    cv = await cv;

    console.log(cv.getBuildInformation());

})();
```

---

# Рекомендована архітектура

```text
app.js
│
├── await OpenCvLoader.load()
│
├── await CameraManager.start()
│
├── new ArucoDetector(cv)
│
├── new Renderer(...)
│
└── application.run()
```

---

# Рекомендований стиль OpenCV 5

Замість вкладених callback-функцій:

```javascript
OpenCvLoader.load(() => {

    start();

});
```

краще використовувати сучасний асинхронний стиль:

```javascript
const cv = await OpenCvLoader.load();

const camera = new CameraManager();
await camera.start();

const detector = new ArucoDetector(cv);

const renderer = new Renderer(canvas);

const app = new Application(
    camera,
    detector,
    renderer
);

await app.run();
```

---

# Особливості OpenCV 5

- `cv` може бути Promise.
- Старий спосіб через `cv.onRuntimeInitialized` працює лише для OpenCV 4.
- Для OpenCV 5 рекомендується використовувати `await`.
- Підхід через `async/await` значно спрощує структуру програми.

---

# Підсумок

Під час перевірки збірки було встановлено:

- ✅ OpenCV.js 5.0 успішно зібрано.
- ✅ OpenCV Contrib підключено.
- ✅ Модуль ArUco присутній.
- ✅ `aruco_ArucoDetector` доступний.
- ✅ `aruco_Dictionary` доступний.
- ✅ `aruco_DetectorParameters` доступний.
- ✅ Збірка використовує `SINGLE_FILE=1`.
- ✅ Об'єкт `cv` реалізований як `Promise`.
- ✅ OpenCV готовий до використання у вебпроєкті.

---

# Рекомендація

Для нових проєктів на OpenCV 5 доцільно повністю перейти на архітектуру, побудовану на `async/await`. Це забезпечує:

- сумісність із сучасними версіями OpenCV.js;
- простішу структуру коду;
- легшу підтримку;
- зручне масштабування при додаванні нових асинхронних компонентів (наприклад, моделей, словників, WebAssembly-модулів або мережевих ресурсів).



Нижче надаю рекомендації у вигляді одного Markdown-документа. Вони враховують Вашу поточну архітектуру проєкту:

OpenCvLoader
CameraManager
FrameProvider
ArucoDetector
Renderer
Application

та перехід з попереднього підходу js-aruco2/старого OpenCV.js API на OpenCV.js 5.0.0 ArUcoDetector API.

# Міграція ArUco-модуля на OpenCV.js 5.0.0

## 1. Загальні висновки

Поточна збірка:

- OpenCV: 5.0.0
- OpenCV-contrib: 5.0.0
- Emscripten: 6.0.5
- Target: WebAssembly

ArUco API успішно перевірено.

Підтверджені класи:

```javascript
cv.aruco_ArucoDetector
cv.aruco_Dictionary
cv.aruco_DetectorParameters
cv.aruco_RefineParameters
2. Основні зміни API
Було (старий підхід)

Можливо використовувався:

cv.detectMarkers(
    image,
    dictionary,
    corners,
    ids,
    parameters
);

або стороння бібліотека:

AR.Detector.detect()
Стало (OpenCV.js 5)

Необхідно створювати об'єкт:

const detector =
    new cv.aruco_ArucoDetector(
        dictionary,
        detectorParameters,
        refineParameters
    );

та викликати:

detector.detectMarkers(
    image,
    corners,
    ids
);
3. Структура файлів

Рекомендована структура:

project/
│
├── index.html
│
├── js/
│   │
│   ├── app.js
│   │
│   ├── core/
│   │   └── OpenCvLoader.js
│   │
│   ├── camera/
│   │   └── CameraManager.js
│   │
│   ├── aruco/
│   │   └── ArucoDetector.js
│   │
│   ├── renderer/
│   │   └── Renderer.js
│   │
│   └── utils/
│       └── Logger.js
│
└── vendor/
    └── opencv.js
4. OpenCvLoader.js
Зміни

Не використовувати:

cv.onRuntimeInitialized

як основний механізм.

OpenCV.js 5 повертає Promise.

Приклад:

export class OpenCvLoader {

    static async load() {

        if (cv instanceof Promise) {
            return await cv;
        }

        return cv;
    }

}
5. ArucoDetector.js
Повністю замінити стару реалізацію
export class ArucoDetector {


    constructor(cv) {

        this.cv = cv;


        this.dictionary =
            cv.getPredefinedDictionary(
                cv.aruco_PredefinedDictionaryType.DICT_4X4_1000
            );


        this.parameters =
            new cv.aruco_DetectorParameters();


        this.refineParameters =
            new cv.aruco_RefineParameters(
                10.0,
                3.0,
                true
            );


        this.detector =
            new cv.aruco_ArucoDetector(
                this.dictionary,
                this.parameters,
                this.refineParameters
            );

    }



    detect(frame) {


        const corners =
            new this.cv.MatVector();


        const ids =
            new this.cv.Mat();



        this.detector.detectMarkers(
            frame,
            corners,
            ids
        );


        const result = {

            ids: [],

            corners: []

        };


        for(
            let i = 0;
            i < ids.rows;
            i++
        ){

            result.ids.push(
                ids.data32S[i]
            );

        }


        for(
            let i = 0;
            i < corners.size();
            i++
        ){

            result.corners.push(
                corners.get(i)
            );

        }


        corners.delete();
        ids.delete();


        return result;

    }

}
6. app.js
Змінити ініціалізацію

Було:

const detector =
    new ArucoDetector();

Стало:

const cv =
    await OpenCvLoader.load();


const detector =
    new ArucoDetector(cv);
7. FrameProvider

Залишити без змін.

Потік:

Camera
   |
   v
Video Frame
   |
   v
cv.Mat
   |
   v
ArucoDetector
8. Renderer.js

Не залежить від змін API.

Отримує:

{
    ids:[
        12,
        25
    ],

    corners:[
        ...
    ]
}

та малює:

рамку маркера;
ID;
додаткову інформацію.
9. Обробка пам'яті WebAssembly

ВАЖЛИВО.

Кожний OpenCV об'єкт треба видаляти:

Правильно:

const mat = new cv.Mat();

...

mat.delete();

Особливо:

Mat
MatVector
Point
Dictionary
10. Тест після інтеграції

У браузері:

console.log(cv.aruco_ArucoDetector);

має бути:

class aruco_ArucoDetector

Перевірка:

console.log(
    detector.detect
);
11. Етапи переходу
Етап 1

Замінити тільки:

js/aruco/ArucoDetector.js
Етап 2

Перевірити:

створення словника;
створення детектора;
запуск detectMarkers.
Етап 3

Підключити камеру:

CameraManager
        |
        v
FrameProvider
        |
        v
ArucoDetector
        |
        v
Renderer
12. Параметри ArUco

Поточні:

new cv.aruco_RefineParameters(
    10.0,
    3.0,
    true
);

Після тестів можна оптимізувати:

швидкість;
кількість помилкових спрацьовувань;
якість кутів.
13. Очікуваний результат

Після міграції:

✅ OpenCV.js 5.0.0
✅ WebAssembly
✅ ArUco DICT_4X4_1000
✅ ArucoDetector C++ API
✅ модульна архітектура збережена
✅ готовність до:

pose estimation;
solvePnP;
3D overlay;
WebAR

Ця міграція не потребує зміни `CameraManager`, `Renderer` і загальної структури застосунку. Основна зміна концентрується у двох місцях: **`OpenCvLoader.js` (Promise-ініціалізація)** та **`ArucoDetector.js` (новий клас `cv.aruco_ArucoDetector`)**.