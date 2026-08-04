# Створення власної збірки OpenCV.js

## Інструкція створення OpenCV.js з підтримкою ArUco-модуля в ОС Linux Debian

### 1 Встановлення пакунків

sudo apt install python3
sudo apt install python3-pip
- встановлення базового набору інструментів для компіляції програм із вихідного коду (gcc, make, ... )
sudo apt install build-essential
- встановлення пакунку розробника для для компіляції розширень на C/C++
sudo apt install python3-dev
- створення команди python
sudo apt install python-is-python3
- встановлення системи генерації конфігурації збірки cmake
sudo apt install cmake

### 2 Встановлення Emscripten SDK (emsdk)
Emscripten SDK (emsdk) - інструменти компіляції програм мовами C/C++ у WebAssembly (WASM) та JavaScript для виконання у веб-браузері.

- 2.1 Створення робочого каталогу та клонування SDK:
mkdir -p ~/dev
cd ~/dev
git clone https://github.com/emscripten-core/emsdk.git

- 2.2 Перехід у каталог та встановлення:
cd ~/dev/emsdk
./emsdk install latest

- 2.3 Активація та завантаження змінних середовища:
./emsdk activate latest
source ./emsdk_env.sh

### 3 Завантаження OpenCV та перехід до версії-гілки
cd ~/dev
git clone https://github.com/opencv/opencv.git
cd opencv
git fetch --all
git tag -l "5*"

git checkout -b 5.x origin/5.x
git checkout 5.0.0

### 4 Завантаження OpenCV Contrib з додатковими модулями, наприклад, ArUco
cd ~/dev
git clone https://github.com/opencv/opencv_contrib.git
cd opencv_contrib
git checkout -b 5.x origin/5.x

### 5 Створення каталогу збірки
rm -rf ~/dev/opencv-build
mkdir ~/dev/opencv-build

### 6 Активація Emscripten
Перед кожною збіркою необхідно активувати SDK:
cd ~/dev/emsdk
source ./emsdk_env.sh

### 7 Конфігурація OpenCV.js з автоматизованим налаштуванням cmake
cd ~/dev/opencv

python platforms/js/build_js.py \
    ~/dev/opencv-build \
    --build_wasm \
    --config_only \
    --cmake_option="-DOPENCV_EXTRA_MODULES_PATH=$HOME/dev/opencv_contrib/modules" \
    --cmake_option="-DWITH_HARFBUZZ=OFF" \
    --cmake_option="-DBUILD_opencv_freetype=OFF"

### 8 Компіляція з використанням максимальної кількості ядер (через команду nproc)
cd ~/dev/opencv-build
make -j$(nproc)

$(nproc) автоматично визначає кількість процесорних ядер і використовує їх для паралельної компіляції.

### 9 Копіювання результату збірки
ls ~/dev/opencv-build/bin/
Після успішної компіляції будуть створені файли:
opencv.js
opencv_js.wasm
cp opencv.js /...
scp -P 1234 blazhko@localhost:/home/blazhko/dev/opencv-build/bin/opencv.js .

scp -P 1234 blazhko@localhost:/home/blazhko/dev/opencv-build/bin/opencv_js.js .

### Перевірка роботи
- запустити в каталозі сервер
http_server .
- перевірити роботу
http://127.0.0.1:8080/test.html


### 
## Інструкція створення OpenCV.js з підтримкою ArUco-модуля.

Середовище:

- Windows 11
- Python 3.10
- Git
- CMake
- Ninja
- Emscripten SDK
- OpenCV 4.10.0
- OpenCV Contrib 4.10.0


---

# Етап 1. Перевірка Python

Перевірка версії Python:

```powershell
py --version
```

Результат:

```
Python 3.10.0
```

---

# Етап 2. Перевірка Git

```powershell
git --version
```

Результат:

```
git version 2.48.1.windows.1
```

---

# Етап 3. Перевірка CMake

```powershell
cmake --version
```

Результат:

```
cmake version 4.4.2
```

---

# Етап 4. Встановлення Emscripten SDK

Перехід у робочу директорію:

```powershell
cd C:\dev
```

Клонування Emscripten SDK:

```powershell
git clone https://github.com/emscripten-core/emsdk.git
```

Перехід у каталог SDK:

```powershell
cd C:\dev\emsdk
```

Встановлення останньої версії:

```powershell
.\emsdk install latest
```

Активація:

```powershell
.\emsdk activate latest
```

Завантаження змінних середовища:

```powershell
.\emsdk_env.ps1
```

Перевірка:

```powershell
emcc --version
```

Приклад результату:

```
emcc (Emscripten gcc/clang-like replacement) ...
```

---

# Етап 5. Завантаження OpenCV

Перехід у робочу директорію:

```powershell
cd C:\dev
```

Клонування OpenCV:

```powershell
git clone https://github.com/opencv/opencv.git
```

Перехід у каталог:

```powershell
cd C:\dev\opencv
```

Перехід на версію 4.10.0:

```powershell
git checkout 4.10.0
```

Перевірка:

```powershell
git status
```

---

# Етап 6. Завантаження OpenCV Contrib

Перехід у робочу директорію:

```powershell
cd C:\dev
```

Клонування:

```powershell
git clone https://github.com/opencv/opencv_contrib.git
```

Перехід у каталог:

```powershell
cd C:\dev\opencv_contrib
```

Перехід на відповідну версію:

```powershell
git checkout 4.10.0
```

---

# Етап 7. Встановлення Ninja

Встановити Ninja:

https://github.com/ninja-build/ninja/releases

Скопіювати:

```
ninja.exe
```

наприклад:

```
C:\dev\
```

Додати до PATH поточної сесії PowerShell:

```powershell
$env:PATH += ";C:\dev"
```

Перевірка:

```powershell
ninja --version
```

---

# Етап 8. Створення каталогу збірки

У PowerShell:

```powershell
Remove-Item C:\dev\opencv-build -Recurse -Force
```

Створення каталогу:

```powershell
mkdir C:\dev\opencv-build
```

---

# Етап 9. Налаштування Emscripten середовища

Перед збіркою необхідно активувати SDK:

```powershell
cd C:\dev\emsdk

.\emsdk_env.ps1
```

---

# Етап 10. Конфігурація OpenCV.js

Перейти у каталог OpenCV:

```powershell
cd C:\dev\opencv
```

Запустити конфігурацію:

```powershell
python platforms/js/build_js.py C:\dev\opencv-build `
    --build_wasm `
    --cmake_option="-GNinja" `
    --cmake_option="-DOPENCV_EXTRA_MODULES_PATH=C:\dev\opencv_contrib\modules"
```

Після виконання буде створено CMake-конфігурацію.

---

# Етап 11. Виправлення конфігурації OpenCV.js

Під час збірки OpenCV.js версії **4.10.0** було виявлено проблеми сумісності
з деякими вебзастосунками та JavaScript-модулями.

Перед внесенням змін можна перевірити збірку більш нової версії OpenCV:

```powershell
cd C:\dev\opencv
git checkout 4.12.0
```

## 11.1. Перехід з C++11 на C++17

Файл:

```
C:\dev\opencv\modules\js\CMakeLists.txt
```

Знайти:

```
-std=c++11
```

Замінити на:

```
-std=c++17
```

---

## 11.2. Видалення DEMANGLE_SUPPORT

У тому ж файлі:

```
C:\dev\opencv\modules\js\CMakeLists.txt
```

знайти:

```cmake
set(EMSCRIPTEN_LINK_FLAGS "${EMSCRIPTEN_LINK_FLAGS} -s EXPORT_NAME=\"'cv'\" -s DEMANGLE_SUPPORT=1")
```

замінити на:

```cmake
set(EMSCRIPTEN_LINK_FLAGS "${EMSCRIPTEN_LINK_FLAGS} -s EXPORT_NAME=\"'cv'\"")
```

Причина:

параметр:

```
-s DEMANGLE_SUPPORT=1
```

у нових версіях Emscripten може викликати помилки під час лінкування.

---

# Етап 12. Компіляція

Перейти у каталог збірки:

```powershell
cd C:\dev\opencv-build
```

Запустити Ninja:

```powershell
ninja opencv.js
```

Процес може зайняти значний час.

---

# Етап 13. Результат збірки

Після успішної компіляції будуть створені:

```
opencv.js
opencv_js.wasm
```

Типове розташування:

```
C:\dev\opencv-build\bin\
```

---

# Етап 14. Перевірка ArUco

Для перевірки необхідно переконатися, що OpenCV містить:

```
aruco_ArucoDetector
aruco_DetectorParameters
aruco_Dictionary
```

Перевірка у браузері:

```javascript
console.log(cv.aruco_ArucoDetector);
```

Очікуваний результат:

```
function constructor(args)
```

---

# Етап 15. Інтеграція у Web-проєкт

Скопіювати отриманий файл:

```
opencv.js
```

у:

```
js/libs/opencv/opencv.js
```

Підключення:

```html
<script src="libs/opencv/opencv.js"></script>
```

---

# Підсумок

Отримана збірка підтримує:

- OpenCV.js;
- WebAssembly;
- ArUco detection;
- OpenCV Contrib modules;
- використання у браузерних AR-застосунках.

