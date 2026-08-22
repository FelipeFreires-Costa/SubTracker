import React, { useEffect, useState } from "react";
import "./Header.css";
import { NavLink } from "react-router-dom";
import { FaGithub, FaWallet, FaUserCircle, FaListUl, FaChartPie, FaRegClock } from "react-icons/fa";
import { HiOutlineMenuAlt2 } from "react-icons/hi";

const Header = () => {
  const [nomeUsuario, setNomeUsuario] = useState(() => {
    const dadosSalvos = localStorage.getItem("Editar-nome");
    if (dadosSalvos) {
      return JSON.parse(dadosSalvos);
    }
    return "Editar Nome";
  });

  const [sidebarAberta, setSidebarAberta] = useState(() => {
    const salvo = localStorage.getItem("sidebar-aberta");
    return salvo === null ? true : salvo === "true";
  });

  useEffect(() => {
    localStorage.setItem("Editar-nome", JSON.stringify(nomeUsuario));
  }, [nomeUsuario]);

  useEffect(() => {
    localStorage.setItem("sidebar-aberta", String(sidebarAberta));
  }, [sidebarAberta]);

  const [editandoNome, setEditandoNome] = useState(false);

  return (
    <aside className={`app-sidebar ${sidebarAberta ? "aberta" : "fechada"}`}>
      <div className="sidebar-topo">
        <div className="logo-area">
          <FaWallet size={26} color="#1589b5" />
          {sidebarAberta && <h1>SubTracker</h1>}
        </div>

        <button
          className="btn-sidebar"
          onClick={() => setSidebarAberta((aberta) => !aberta)}
          title={sidebarAberta ? "Recolher menu" : "Abrir menu"}
          aria-label={sidebarAberta ? "Recolher menu" : "Abrir menu"}
        >
          <HiOutlineMenuAlt2 size={22} />
        </button>
      </div>

      <nav className="nav-links">
        <NavLink to="/" end title="Contas">
          <FaListUl size={18} />
          {sidebarAberta && <span>Contas</span>}
        </NavLink>

        <NavLink to="/relatorio" title="Relatórios">
          <FaChartPie size={18} />
          {sidebarAberta && <span>Relatórios</span>}
        </NavLink>

        <NavLink to="/historico" title="Histórico">
          <FaRegClock size={18} />
          {sidebarAberta && <span>Histórico</span>}
        </NavLink>
      </nav>

      <div className="user-area">
        <a
          href="https://github.com/FelipeFreires-Costa"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          title="GitHub"
        >
          <FaGithub size={18} />
          {sidebarAberta && <span>GitHub</span>}
        </a>

        {editandoNome && sidebarAberta ? (
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
          <button
            type="button"
            className="profile"
            onClick={() => sidebarAberta && setEditandoNome(true)}
            title={sidebarAberta ? "Clique para editar o nome" : nomeUsuario}
          >
            <FaUserCircle size={28} color="#999" />
            {sidebarAberta && <span>{nomeUsuario}</span>}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Header;
