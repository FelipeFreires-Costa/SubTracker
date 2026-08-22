import Header from "./Components/Header/Header";
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Relatorio } from './pages/Relatorio';
import { Historico } from './pages/Historico';
import "./App.css";

function App() {
  return (
    <div className="app-wrapper">
      <Header />
      <div className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/relatorio" element={<Relatorio />} />
          <Route path="/historico" element={<Historico />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;