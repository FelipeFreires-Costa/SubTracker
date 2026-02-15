import Header from "./Components/Header/Header";
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';       // Importa a Home que criamos acima
import { Relatorio } from './pages/Relatorio'; // Importa seu Relatório
import "./App.css";

function App() {
  return (
    <div className="app-wrapper">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/relatorio" element={<Relatorio />} />
      </Routes>
    </div>
  );
}

export default App;