import Header from "./Components/Header/Header";
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Relatorio } from './pages/Relatorio';
import { Fatura } from './pages/Fatura';
import { DemonstracaoAcademica } from './pages/DemonstracaoAcademica';
import "./App.css";

function App() {
  return (
    <div className="app-wrapper">
      <Header />
      <div className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/relatorio" element={<Relatorio />} />
          <Route path="/fatura" element={<Fatura />} />
          <Route path="/demonstracao-academica" element={<DemonstracaoAcademica />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
