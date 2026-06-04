import { Link, Navigate, Route, Routes } from 'react-router-dom';
import Game from './pages/Game/index.jsx';
import ChernyshevOlehGame from './pages/ChernyshevOleh/index.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/game" replace />} />
      <Route path="/game" element={<Game />} />
      <Route path="/chernyshev-oleh" element={<ChernyshevOlehGame />} />
      <Route
        path="*"
        element={
          <main className="app-shell">
            <h1>Сторінку не знайдено</h1>
            <Link to="/game">Повернутися до списку ігор</Link>
          </main>
        }
      />
    </Routes>
  );
}

export default App;
