const EASY_MOD = 0.12; //0/12
const MEDIUM_MOD = 0.16;
const HARD_MOD = 0.21;
const BOMB = "bomb";
let isGameStillRunning = true;
let isFirtsClick = true;
let bombCountGlobal = 0;
let flagsPlaced = 0;
let arr
let timerInterval = null;
let secondsPassed = 0;


function updateFlagCounter() {
    const counter = document.getElementById('flag-counter');
    if (!counter) return;
    const remaining = bombCountGlobal - flagsPlaced;
    counter.textContent = String(remaining);
    if (remaining == 0 && isAllBombsRMarked()) {
        alert('you win');
        isGameStillRunning = false;
        stopTimer();
    }
}
function openCellsAroundZero(row, column) {

    openCell(row + 1, column + 1);
    openCell(row + 1, column);
    openCell(row + 1, column - 1);
    openCell(row, column - 1);
    openCell(row, column + 1);
    openCell(row - 1, column - 1);
    openCell(row - 1, column);
    openCell(row - 1, column + 1);
}
function openCell(row, column) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${column}"]`);
    if (cell && !cell.classList.contains('is-marked') && !cell.classList.contains('is-flipped')) {
        cell.classList.add('is-flipped');

        if (cell.dataset.value === "0") {
            openCellsAroundZero(row, column);
        }
    }
}
function revealMapAfterLose() {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[0].length; j++) {

            const cell = document.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);

            const val = cell.dataset.value;
            const isMarked = cell.classList.contains('is-marked');

            if (val === BOMB && !isMarked) {
                cell.classList.add('is-flipped');
            } else if (val !== BOMB && isMarked) {
                cell.classList.add('was-wrongly-marked');
            }
        }
    }

}

function isAllBombsRMarked() {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[0].length; j++) {
            const cellElement = document.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
            const isMarked = cellElement.classList.contains('is-marked');
            if (isBomb(arr, i, j) && !isMarked) return false;
            if (!isBomb(arr, i, j) && isMarked) return false;
        }
    }
    return true
}


// Вешаем события на родителя ОДИН РАЗ
document.addEventListener('DOMContentLoaded', () => {

    const easyBtn = document.querySelector('.controls input[value="Easy"]');
    const mediumBtn = document.querySelector('.controls input[value="Medium"]');
    const hardBtn = document.querySelector('.controls input[value="Hard"]');

    // 2. Вешаем на них слушатели кликов
    easyBtn.addEventListener('click', () => run(9, 9, EASY_MOD));
    mediumBtn.addEventListener('click', () => run(14, 14, MEDIUM_MOD));
    hardBtn.addEventListener('click', () => run(19, 19, HARD_MOD));

    run(9, 9, EASY_MOD);

    const matrix = document.getElementById('matrix');

    // ЛЕВЫЙ КЛИК (открытие)
    matrix.addEventListener('click', (e) => {
        if (isFirtsClick) {
            startTimer();
            isFirtsClick = false;
        }

        const cell = e.target.closest('.cell'); // Ищем, был ли клик именно по ячейке

        if (!cell || !isGameStillRunning) return;

        const val = cell.dataset.value;
        cell.classList.add('is-flipped');

        if (!cell.classList.contains('is-marked')) {
            if (val === "0") {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                openCellsAroundZero(row, col);
            }

            if (cell.classList.contains('is-flipped') && val === "bomb") {
                cell.classList.add('isExploded');
                stopTimer();
                alert('hah, i`d win');
                isGameStillRunning = false;
                revealMapAfterLose();

            }

        }
    });
    // ПРАВЫЙ КЛИК (флаг)
    matrix.addEventListener('contextmenu', (e) => {
        const cell = e.target.closest('.cell');
        if (!cell || !isGameStillRunning) return;

        e.preventDefault();
        if (cell.classList.contains('is-flipped')) return;

        // If adding a flag
        if (!cell.classList.contains('is-marked')) {
            cell.classList.add('is-marked');
            flagsPlaced++;

        } else {

            cell.classList.remove('is-marked');
            flagsPlaced--;
        }

        updateFlagCounter();
    });
});




function fieldGeneration(rows, cols) {
    return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function calculateBombCount(arr, mode = EASY_MOD) {
    return Math.ceil(arr.length * arr[0].length * mode);
}

function generateBombs(arr, bombCount) {
    for (let i = 0; i < bombCount; i++) {
        generateBomb(arr);
    }
}

function generateBomb(arr) {
    const i = Math.floor(Math.random() * arr.length);
    const j = Math.floor(Math.random() * arr[0].length);
    if (arr[i][j] === BOMB) {
        generateBomb(arr);
    } else {
        arr[i][j] = BOMB;
    }
}

function isBomb(arr, i, j) {
    return BOMB === arr[i][j];
}

function wrapBombs(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[0].length; j++) {
            if (isBomb(arr, i, j)) {
                wrapBomb(arr, i + 1, j + 1);
                wrapBomb(arr, i + 1, j);
                wrapBomb(arr, i + 1, j - 1);
                wrapBomb(arr, i, j - 1);
                wrapBomb(arr, i, j + 1);
                wrapBomb(arr, i - 1, j - 1);
                wrapBomb(arr, i - 1, j);
                wrapBomb(arr, i - 1, j + 1);
            }
        }
    }
}

function wrapBomb(arr, row, column) {
    if (row >= 0 && row < arr.length && column >= 0 && column < arr[0].length) {
        if (arr[row][column] !== BOMB) {
            arr[row][column] = arr[row][column] + 1;
        }
    }
}
function updateTimerDisplay() {
    const minutes = Math.floor(secondsPassed / 60);
    const seconds = secondsPassed % 60;
    // padStart(2, '0') проверяет длину строки. 
    // Если в строке 1 символ (например, "5"), он добавляет '0' в начало -> "05".
    // Если 2 символа ("12"), он ничего не делает. 
    // String() нужен, потому что у обычных чисел нет метода padStart, он есть только у текста.
    const display = String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
    document.getElementById('timer').textContent = display;
}
function resetTimer() {
    stopTimer();
    secondsPassed = 0;
    updateTimerDisplay();
}

function startTimer() {
    resetTimer();

    // setInterval — встроенная команда браузера. Выполняет код внутри { } каждые 1000 миллисекунд (1 секунда).
    // Мы сохраняем идентификатор этого цикла в переменную timerInterval.
    timerInterval = setInterval(() => {
        if (isGameStillRunning) {
            secondsPassed++;
            updateTimerDisplay();
        } else {
            stopTimer();
        }
    }, 1000); // 1000 мс = 1 секунда

} function stopTimer() {
    // clearInterval — команда браузера, которая уничтожает цикл, зная его идентификатор.
    clearInterval(timerInterval);
    timerInterval = null;
}


function clenup() {
    document.querySelectorAll('.cell').forEach(cell => cell.remove());
}

function run(rows, cols, mode = EASY_MOD) {
    clenup();
    resetTimer();
    isGameStillRunning = true;
    isFirtsClick = true;
    let  matrix = document.getElementById('matrix');
    matrix.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    arr = fieldGeneration(rows, cols);
    let  bombCount = calculateBombCount(arr, mode);
    generateBombs(arr, bombCount);
    wrapBombs(arr);

    // initialize flag counter for this run
    bombCountGlobal = bombCount;
    flagsPlaced = 0;
    updateFlagCounter();


    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[0].length; j++) {
            const divCell = document.createElement('div');
            divCell.classList.add('cell');
            divCell.dataset.row = i;
            divCell.dataset.col = j;
            divCell.dataset.value = arr[i][j]; // Сохраняем значение (0, 1, bomb)

            const value = arr[i][j];

            const img = document.createElement('img');
            img.src = `img/${value}.png`;
            img.alt = value;
            img.classList.add('cell-img');
            divCell.appendChild(img);

            if (value === BOMB) {
                const expImg = document.createElement('img');
                expImg.src = `img/explosion.png`; // Твоя отдельная картинка
                expImg.classList.add('explosion-img'); // Специальный класс
                divCell.appendChild(expImg);
            }

            const imgFlag = document.createElement('img');
            imgFlag.src = "img/flag.png";
            imgFlag.classList.add('mark-img');
            divCell.appendChild(imgFlag);

            const imgMissFlag = document.createElement('img');
            imgMissFlag.src = "img/missFlag.png";
            imgMissFlag.classList.add('miss-mark-img');
            divCell.appendChild(imgMissFlag);

            matrix.appendChild(divCell);
        }
    }

}
