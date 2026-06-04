import { Link } from 'react-router-dom';
import styles from './Game.module.css';

const implementations = [
  {
    name: 'Чернишев Олег',
    path: '/chernyshev-oleh',
    description: 'React-версія Minesweeper з компонентами та CSS Modules.',
  },
];

function Game() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>CS11 Minesweeper</p>
        <h1>Play Game</h1>
      </header>

      <section className={styles.list} aria-label="Список реалізацій гри">
        {implementations.map((implementation) => (
          <Link
            className={styles.card}
            key={implementation.path}
            to={implementation.path}
          >
            <span>{implementation.name}</span>
            <small>{implementation.description}</small>
          </Link>
        ))}
      </section>
    </main>
  );
}

export default Game;
