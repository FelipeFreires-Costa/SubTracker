import React, { useEffect, useState } from "react";
import "./Header.css";
import { Relatorio } from "../../pages/Relatorio";
import { NavLink } from "react-router-dom";
import { FaGithub, FaWallet, FaUserCircle } from "react-icons/fa";

const Header = () => {
  const [nomeUsuario, setNomeUsuario] = useState(() => {
    const dadosSalvos = localStorage.getItem("Editar-nome");
    if (dadosSalvos) {
      return JSON.parse(dadosSalvos);
    } else {
      return "Editar Nome";
    }
  });

  useEffect(() => {
    localStorage.setItem("Editar-nome", JSON.stringify(nomeUsuario));
  }, [nomeUsuario]);

  const [editandoNome, setEditandoNome] = useState(false);

  return (
    <div className="app-header">
      <div className="logo-area">
        <FaWallet size={28} color="#0077ff" />
        <h1>SubTracker</h1>
      </div>

      <nav className="nav-links">
        <NavLink
          to="/"
          end
        >
          Minhas Contas
        </NavLink>

        <NavLink
          to="/relatorio"
        >
          Relatórios
        </NavLink>
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
              <span
                onClick={() => setEditandoNome(true)}
                title="Clique para editar"
              >
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
