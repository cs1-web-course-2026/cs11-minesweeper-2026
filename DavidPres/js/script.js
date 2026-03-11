let isGameStillRunning = true;
let bombCountGlobal = 0;
let flagsPlaced = 0;

function updateFlagCounter() {
    const counter = document.getElementById('flag-counter');
    if (!counter) return;
    const remaining = bombCountGlobal - flagsPlaced;
    counter.textContent = String(remaining);
}
function openCellsAroundZero(i, j) {

    openCell(i + 1, j + 1);
    openCell(i + 1, j);
    openCell(i + 1, j - 1);
    openCell(i, j - 1);
    openCell(i, j + 1);
    openCell(i - 1, j - 1);
    openCell(i - 1, j);
    openCell(i - 1, j + 1);
}
function openCell(i, j) {
    const cell = document.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
    if (cell && !cell.classList.contains('is-marked') && !cell.classList.contains('is-flipped')) {
        cell.classList.add('is-flipped');

        if (cell.dataset.value === "0") {
            openCellsAroundZero(i, j);
        }
    }
}
// Вешаем события на родителя ОДИН РАЗ
document.addEventListener('DOMContentLoaded', () => {
    run(9, 9, EASY_MOD);

    const matrix = document.getElementById('matrix');

    // ЛЕВЫЙ КЛИК (открытие)
    matrix.addEventListener('click', (e) => {

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

            if (cell.querySelector('.cell-img').src.includes('bomb')) {
                isGameStillRunning = false;
                // alert('lose');
            }
            if (cell.classList.contains('is-flipped') && val === "bomb") {
                alert('hah, i`d win');
                //  new Promise(resolve => setTimeout(resolve, 100)).then(() => {
                //     run(9, 9, EASY_MOD);
                // });
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

function wrapBomb(arr, i, j) {
    if (i >= 0 && i < arr.length && j >= 0 && j < arr[0].length) {
        if (arr[i][j] !== BOMB) {
            arr[i][j] = arr[i][j] + 1;
        }
    }
}

const EASY_MOD = 0.12;
const MEDIUM_MOD = 0.16;
const HARD_MOD = 0.21;
const BOMB = "bomb";

function clenup() {
    document.querySelectorAll('.cell').forEach(cell => cell.remove());
}

function run(rows, cols, mode = EASY_MOD) {
    clenup();
    isGameStillRunning = true;
    var matrix = document.getElementById('matrix');
    matrix.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    var arr = fieldGeneration(rows, cols);
    var bombCount = calculateBombCount(arr, mode);
    generateBombs(arr, bombCount);
    wrapBombs(arr);

    // initialize flag counter for this run
    bombCountGlobal = bombCount;
    flagsPlaced = 0;
    updateFlagCounter();

    var oneDimensionArr = arr.flat();

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

            const imgFlag = document.createElement('img');
            imgFlag.src = "img/flag.png";
            imgFlag.classList.add('mark-img');
            divCell.appendChild(imgFlag);

            matrix.appendChild(divCell);
        }
    }

}
