

const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 10,
    status: 'process',
    gameTime: 0,
    timerId: null,
};

function generateField(rows, cols, minesCount) {
    let field = [];
    for (let i = 0; i < rows; i++){
        field[i] = [];
        for (let j = 0; j < cols; j++){
            field[i][j] = {
                type: 'empty',
                state: 'closed',
                neighborMines: 0,
            };
        }
    }

    let placesMines = 0;

    while (placesMines < minesCount){
        let randomRow = Math.floor(Math.random() * rows);
        let randomCol = Math.floor(Math.random() * cols);

        if (field[randomRow][randomCol].type === 'empty'){
            field[randomRow][randomCol].type = 'mine';
            placesMines++;
        }
    }

    return field;
}

function countNeighbourMines(field){
    let rows = field.length;
    let cols = field[0].length;
    
    // i - 1, j - 1   |  i - 1, j |   i - 1, j + 1
    // i, j - 1       |  i, j     |   i, j + 1
    // i + 1, j - 1   |  i + 1, j |   i + 1, j + 1

    for (let i = 0; i < rows; i++){
        for (let j = 0; j < cols; j++){
            if (field[i][j].type === 'empty'){
                let minesCount = 0;
                for (let di = -1; di <= 1; di++){
                    for (let dj = -1; dj <= 1; dj++){
                        let ni = i + di;
                        let nj = j + dj;
                        // 4,4 | 4,5 | 4,6
                        // 5,4 | (5,5) | 5,6
                        // 6,4 | 6,5 | 6,6
                        if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && field[ni][nj].type === 'mine'){
                            minesCount++;
                        }
                    }
                }
                field[i][j].neighborMines = minesCount;
            }
        }
    }
    return field;
}

function openCell(row, col){
    if (field[row][col].state === 'opened' || field[row][col].state === 'flagged'){
        return;
    } else if (field[row][col].type === 'mine'){
        gameState.status = 'lose';
        stopTimer();
        console.log("GAME OVER 💀");
        return;
    } else {
        field[row][col].state = 'opened'
        if (field[row][col].neighborMines === 0){
            for (let i = -1; i <= 1; i++){
                for (let j = -1; j <= 1; j++){
                    let ni = row + i;
                    let nj = col + j;
                    if (ni >= 0 && ni < gameState.rows && nj >= 0 && nj < gameState.cols)
                        openCell(ni, nj);
                }
            }
        }
    }
}

function toggleFlag(row, col){
    if (field[row][col].state === 'opened'){
        return;
    } else if (field[row][col].state === 'closed'){
        field[row][col].state = 'flagged';
    } else {
        field[row][col].state = 'closed';
    }
}

function startTimer() {
    gameState.timerId = setInterval(function() {
        gameState.gameTime++
    }, 1000)
}

function stopTimer(){
    clearInterval(gameState.timerId);
}



let field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
field = countNeighbourMines(field);
console.table(field);
