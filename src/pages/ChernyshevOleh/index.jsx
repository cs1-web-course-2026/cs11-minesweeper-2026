import { useEffect, useMemo, useState } from 'react';
import styles from './Minesweeper.module.css';

const CELL_TYPE = {
  EMPTY: 'empty',
  MINE: 'mine',
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose',
};

const GAME_CONFIG = {
  rows: 10,
  cols: 10,
  minesCount: 15,
};

function createCell() {
  return {
    type: CELL_TYPE.EMPTY,
    state: CELL_STATE.CLOSED,
    neighborMines: 0,
    triggered: false,
  };
}

function isInsideField(row, col, rows, cols) {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

function getNeighborPositions(row, col, rows, cols) {
  const positions = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const neighborRow = row + rowOffset;
      const neighborCol = col + colOffset;

      if (isInsideField(neighborRow, neighborCol, rows, cols)) {
        positions.push([neighborRow, neighborCol]);
      }
    }
  }

  return positions;
}

function generateField(rows, cols, minesCount) {
  const field = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, createCell),
  );
  const minePositions = new Set();

  while (minePositions.size < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    minePositions.add(`${row}:${col}`);
  }

  minePositions.forEach((position) => {
    const [row, col] = position.split(':').map(Number);
    field[row][col].type = CELL_TYPE.MINE;
  });

  field.forEach((rowCells, row) => {
    rowCells.forEach((cell, col) => {
      if (cell.type === CELL_TYPE.MINE) {
        return;
      }

      cell.neighborMines = getNeighborPositions(row, col, rows, cols).filter(
        ([neighborRow, neighborCol]) =>
          field[neighborRow][neighborCol].type === CELL_TYPE.MINE,
      ).length;
    });
  });

  return field;
}

function cloneField(field) {
  return field.map((row) => row.map((cell) => ({ ...cell })));
}

function getCellLabel(row, col, cell) {
  if (cell.state === CELL_STATE.FLAGGED) {
    return `Клітинка ${row + 1}, ${col + 1}: прапорець`;
  }

  if (cell.state === CELL_STATE.CLOSED) {
    return `Клітинка ${row + 1}, ${col + 1}: закрита`;
  }

  if (cell.type === CELL_TYPE.MINE) {
    return `Клітинка ${row + 1}, ${col + 1}: міна`;
  }

  if (cell.neighborMines === 0) {
    return `Клітинка ${row + 1}, ${col + 1}: відкрита порожня`;
  }

  return `Клітинка ${row + 1}, ${col + 1}: ${cell.neighborMines} мін поруч`;
}

function getCellText(cell) {
  if (cell.state === CELL_STATE.FLAGGED) {
    return '⚑';
  }

  if (cell.state === CELL_STATE.OPENED && cell.type === CELL_TYPE.MINE) {
    return '✹';
  }

  if (cell.state === CELL_STATE.OPENED && cell.neighborMines > 0) {
    return cell.neighborMines;
  }

  return '';
}

function getCellClassName(cell) {
  const classNames = [styles.cell];

  if (cell.state === CELL_STATE.CLOSED) {
    classNames.push(styles.closed);
  }

  if (cell.state === CELL_STATE.FLAGGED) {
    classNames.push(styles.flagged);
  }

  if (cell.state === CELL_STATE.OPENED) {
    if (cell.type === CELL_TYPE.MINE) {
      classNames.push(styles.mine);

      if (cell.triggered) {
        classNames.push(styles.triggered);
      }
    } else {
      classNames.push(styles.open);
      classNames.push(styles[`number${cell.neighborMines}`]);
    }
  }

  return classNames.join(' ');
}

function openSafeCells(field, startRow, startCol) {
  const rows = field.length;
  const cols = field[0].length;
  const stack = [[startRow, startCol]];

  while (stack.length > 0) {
    const [row, col] = stack.pop();
    const cell = field[row][col];

    if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
      continue;
    }

    cell.state = CELL_STATE.OPENED;

    if (cell.neighborMines === 0) {
      getNeighborPositions(row, col, rows, cols).forEach(
        ([neighborRow, neighborCol]) => {
          const neighborCell = field[neighborRow][neighborCol];

          if (
            neighborCell.type === CELL_TYPE.EMPTY &&
            neighborCell.state === CELL_STATE.CLOSED
          ) {
            stack.push([neighborRow, neighborCol]);
          }
        },
      );
    }
  }
}

function revealMines(field, triggeredRow, triggeredCol) {
  field.forEach((rowCells, row) => {
    rowCells.forEach((cell, col) => {
      if (cell.type === CELL_TYPE.MINE) {
        cell.state = CELL_STATE.OPENED;
      }

      cell.triggered = row === triggeredRow && col === triggeredCol;
    });
  });
}

function isWin(field) {
  return field
    .flat()
    .every((cell) => cell.type === CELL_TYPE.MINE || cell.state === CELL_STATE.OPENED);
}

function Timer({ seconds }) {
  return (
    <div className={styles.statusPanel} aria-label="Таймер">
      <span>Time</span>
      <strong>{String(seconds).padStart(3, '0')}</strong>
    </div>
  );
}

function FlagsCounter({ flagsLeft }) {
  return (
    <div className={styles.statusPanel} aria-label="Кількість прапорців">
      <span>Flags</span>
      <strong>{String(flagsLeft).padStart(3, '0')}</strong>
    </div>
  );
}

function RestartButton({ onRestart }) {
  return (
    <button
      aria-label="Почати нову гру"
      className={styles.restartButton}
      type="button"
      onClick={onRestart}
    >
      <span aria-hidden="true">↻</span>
      New game
    </button>
  );
}

function GameStatus({ status }) {
  const messageByStatus = {
    [GAME_STATUS.PROCESS]: 'Гру почато. Відкрийте першу клітинку.',
    [GAME_STATUS.WIN]: 'Перемога! Усі безпечні клітинки відкрито.',
    [GAME_STATUS.LOSE]: 'Поразка. Ви натиснули на міну.',
  };

  return (
    <p className={`${styles.message} ${styles[status]}`} aria-live="polite">
      {messageByStatus[status]}
    </p>
  );
}

function Cell({ cell, row, col, disabled, onOpen, onToggleFlag }) {
  function handleContextMenu(event) {
    event.preventDefault();
    onToggleFlag(row, col);
  }

  return (
    <button
      aria-label={getCellLabel(row, col, cell)}
      className={getCellClassName(cell)}
      disabled={disabled}
      onClick={() => onOpen(row, col)}
      onContextMenu={handleContextMenu}
      role="gridcell"
      type="button"
    >
      {getCellText(cell)}
    </button>
  );
}

function Board({ field, status, onOpen, onToggleFlag }) {
  const disabled = status !== GAME_STATUS.PROCESS;

  return (
    <section className={styles.boardWrap} aria-label="Ігрове поле Minesweeper">
      <div
        aria-disabled={disabled}
        aria-label="Сітка клітинок гри Minesweeper"
        className={`${styles.board} ${styles[status]}`}
        role="grid"
        style={{ '--board-cols': field[0]?.length ?? GAME_CONFIG.cols }}
      >
        {field.map((rowCells, row) =>
          rowCells.map((cell, col) => (
            <Cell
              cell={cell}
              col={col}
              disabled={disabled}
              key={`${row}:${col}`}
              onOpen={onOpen}
              onToggleFlag={onToggleFlag}
              row={row}
            />
          )),
        )}
      </div>
    </section>
  );
}

function MinesweeperGame() {
  const [field, setField] = useState(() =>
    generateField(GAME_CONFIG.rows, GAME_CONFIG.cols, GAME_CONFIG.minesCount),
  );
  const [status, setStatus] = useState(GAME_STATUS.PROCESS);
  const [seconds, setSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const flagsCount = useMemo(
    () => field.flat().filter((cell) => cell.state === CELL_STATE.FLAGGED).length,
    [field],
  );
  const flagsLeft = GAME_CONFIG.minesCount - flagsCount;

  useEffect(() => {
    if (!isTimerActive || status !== GAME_STATUS.PROCESS) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setSeconds((currentSeconds) => currentSeconds + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isTimerActive, status]);

  function startTimer() {
    setIsTimerActive(true);
  }

  function handleOpen(row, col) {
    if (status !== GAME_STATUS.PROCESS) {
      return;
    }

    startTimer();
    setField((currentField) => {
      const nextField = cloneField(currentField);
      const cell = nextField[row][col];

      if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
        return currentField;
      }

      if (cell.type === CELL_TYPE.MINE) {
        cell.state = CELL_STATE.OPENED;
        revealMines(nextField, row, col);
        setStatus(GAME_STATUS.LOSE);
        setIsTimerActive(false);
        return nextField;
      }

      openSafeCells(nextField, row, col);

      if (isWin(nextField)) {
        setStatus(GAME_STATUS.WIN);
        setIsTimerActive(false);
      }

      return nextField;
    });
  }

  function handleToggleFlag(row, col) {
    if (status !== GAME_STATUS.PROCESS) {
      return;
    }

    startTimer();
    setField((currentField) => {
      const nextField = cloneField(currentField);
      const cell = nextField[row][col];

      if (cell.state === CELL_STATE.OPENED) {
        return currentField;
      }

      cell.state =
        cell.state === CELL_STATE.FLAGGED ? CELL_STATE.CLOSED : CELL_STATE.FLAGGED;

      return nextField;
    });
  }

  function handleRestart() {
    setField(generateField(GAME_CONFIG.rows, GAME_CONFIG.cols, GAME_CONFIG.minesCount));
    setStatus(GAME_STATUS.PROCESS);
    setSeconds(0);
    setIsTimerActive(false);
  }

  return (
    <main className={styles.shell}>
      <section className={styles.card} aria-labelledby="game-title">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Практична робота 4</p>
            <h1 id="game-title">Minesweeper</h1>
          </div>

          <div className={styles.controls} aria-label="Панель керування грою">
            <FlagsCounter flagsLeft={flagsLeft} />
            <RestartButton onRestart={handleRestart} />
            <Timer seconds={seconds} />
          </div>
        </header>

        <GameStatus status={status} />
        <Board
          field={field}
          onOpen={handleOpen}
          onToggleFlag={handleToggleFlag}
          status={status}
        />
      </section>
    </main>
  );
}

export default MinesweeperGame;
