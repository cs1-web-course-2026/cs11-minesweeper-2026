const gridElement = document.getElementById('grid');
const minesDisplay = document.getElementById('mines-count');
const timerDisplay = document.getElementById('timer');
const resetBtn = document.getElementById('reset-btn');

let width = 10;
let minesCount = 10;
let cells = [];
let isGameOver = false;
let flagsUsed = 0;
let timer = 0;
let timerInterval = null;

function init() {
    // Сброс всех параметров
    gridElement.innerHTML = '';
    cells = [];
    isGameOver = false;
    flagsUsed = 0;
    timer = 0;
    clearInterval(timerInterval);
    timerInterval = null;
    
    // Обновление табло
    minesDisplay.innerText = minesCount;
    timerDisplay.innerText = "000";

    // Создание массива мин
    let minesArray = Array(minesCount).fill('mine')
        .concat(Array(width * width - minesCount).fill('empty'))
        .sort(() => Math.random() - 0.5);

    for (let i = 0; i < width * width; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.id = i;
        if (minesArray[i] === 'mine') cell.dataset.mine = "true";
        
        // Левый клик — открыть
        cell.addEventListener('click', () => {
            startTimer();
            click(cell);
        });

        // Правый клик — флаг
        cell.oncontextmenu = (e) => {
            e.preventDefault();
            startTimer();
            addFlag(cell);
        };
        
        gridElement.appendChild(cell);
        cells.push(cell);
    }

    // Подсчет цифр (сколько мин вокруг)
    for (let i = 0; i < cells.length; i++) {
        if (cells[i].dataset.mine === "true") continue;
        let total = 0;
        const x = i % width;
        const y = Math.floor(i / width);

        for (let offY = -1; offY <= 1; offY++) {
            for (let offX = -1; offX <= 1; offX++) {
                let targetY = y + offY;
                let targetX = x + offX;
                if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < width) {
                    let targetIndex = targetY * width + targetX;
                    if (cells[targetIndex].dataset.mine === "true") total++;
                }
            }
        }
        cells[i].dataset.v = total;
    }
}

function startTimer() {
    if (!timerInterval && !isGameOver) {
        timerInterval = setInterval(() => {
            timer++;
            timerDisplay.innerText = timer.toString().padStart(3, '0');
        }, 1000);
    }
}

function addFlag(cell) {
    if (isGameOver || cell.classList.contains('opened')) return;

    if (!cell.classList.contains('flag')) {
        // Ставим флаг, если они еще остались
        if (flagsUsed < minesCount) {
            cell.classList.add('flag');
            flagsUsed++;
        }
    } else {
        // Убираем флаг
        cell.classList.remove('flag');
        flagsUsed--;
    }
    // Обновляем счетчик на табло (сколько мин осталось пометить)
    minesDisplay.innerText = (minesCount - flagsUsed).toString().padStart(2, '0');
}

function click(cell) {
    if (isGameOver || cell.classList.contains('opened') || cell.classList.contains('flag')) return;

    if (cell.dataset.mine === "true") {
        gameOver(cell);
    } else {
        let total = cell.dataset.v;
        cell.classList.add('opened');
        
        if (total != 0) {
            cell.innerHTML = total;
            cell.setAttribute('data-v', total); // Для цвета в CSS
        } else {
            // Если ноль — открываем соседей (рекурсия)
            const id = parseInt(cell.dataset.id);
            const x = id % width;
            const y = Math.floor(id / width);

            setTimeout(() => {
                for (let offY = -1; offY <= 1; offY++) {
                    for (let offX = -1; offX <= 1; offX++) {
                        let targetY = y + offY;
                        let targetX = x + offX;
                        if (targetX >= 0 && targetX < width && targetY >= 0 && targetY < width) {
                            click(cells[targetY * width + targetX]);
                        }
                    }
                }
            }, 10);
        }
    }
    checkWin();
}

function checkWin() {
    const revealedCount = cells.filter(c => c.classList.contains('opened')).length;
    if (revealedCount === width * width - minesCount) {
        isGameOver = true;
        clearInterval(timerInterval);
        alert('Вітаю! Ти переміг!');
    }
}

function gameOver(current) {
    isGameOver = true;
    clearInterval(timerInterval);
    cells.forEach(cell => {
        if (cell.dataset.mine === "true") {
            cell.classList.add('mine');
            cell.classList.add('opened');
        }
    });
    current.classList.add('exploded');
    alert('Бум! Гра закінчена.');
}

resetBtn.addEventListener('click', init);
init();
