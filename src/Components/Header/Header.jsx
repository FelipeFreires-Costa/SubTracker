import React, { useEffect, useState } from "react";
import "./Header.css";
// Removi FaBars e FaTimes, mantive só os originais
import { FaGithub, FaWallet, FaUserCircle } from "react-icons/fa";

const Header = () => {
  const [nomeUsuario, setNomeUsuario] = useState(() => {
    const dadosSalvos = localStorage.getItem("Editar-nome")
    if(dadosSalvos){
      return JSON.parse(dadosSalvos)
    }else{
      return "Editar Nome"
    }
  });

  useEffect(() => {
    localStorage.setItem('Editar-nome', JSON.stringify(nomeUsuario))
  },[nomeUsuario])

  const [editandoNome, setEditandoNome] = useState(false);

  return (
    <div className="app-header">
      

      <div className="logo-area">
        <FaWallet size={28} color="#0077ff" />
        <h1>SubTracker</h1>
      </div>


      <nav className="nav-links">
        <a href="#" className="active">Dashboard</a>
        <a href="#">Relatórios</a>
        <a href="#">Configurações</a>
      </nav>

      <div className="user-area">
        <a
          href="https://github.com/FelipeFreires-Costa"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
        >
          <FaGithub size={20} />
          <span>GitHub</span>
        </a>

        <div className="divider"></div>

        <div>
          {editandoNome ? (
            <input
              type="text"
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
              onBlur={() => setEditandoNome(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditandoNome(false);
              }}
              autoFocus
              className="input-nome-editavel"
            />
          ) : (
            <div className="profile">
              <span onClick={() => setEditandoNome(true)} title="Clique para editar">
                {nomeUsuario}
              </span>
              <FaUserCircle size={32} color="#ccc" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;