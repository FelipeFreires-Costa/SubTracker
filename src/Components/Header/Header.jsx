import React, { useEffect, useState } from "react";
import "./Header.css";
import { NavLink } from "react-router-dom";
import { FaWallet, FaListUl, FaChartPie, FaCreditCard } from "react-icons/fa";
import { HiOutlineMenuAlt2 } from "react-icons/hi";

const Header = () => {
  const [sidebarAberta, setSidebarAberta] = useState(() => {
    const salvo = localStorage.getItem("sidebar-aberta");
    const aberta = salvo === null ? true : salvo === "true";
    document.documentElement.style.setProperty("--sidebar-w", aberta ? "230px" : "72px");
    return aberta;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-aberta", String(sidebarAberta));
    document.documentElement.style.setProperty(
      "--sidebar-w",
      sidebarAberta ? "230px" : "72px",
    );
  }, [sidebarAberta]);

  return (
    <aside className={`app-sidebar ${sidebarAberta ? "aberta" : "fechada"}`}>
      <div className="sidebar-topo">
        <div className="logo-area">
          <FaWallet size={26} className="logo-icone" />
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

        <NavLink to="/relatorio" title="Relatório">
          <FaChartPie size={18} />
          {sidebarAberta && <span>Relatório</span>}
        </NavLink>

        <NavLink to="/fatura" title="Fatura">
          <FaCreditCard size={18} />
          {sidebarAberta && <span>Fatura</span>}
        </NavLink>
      </nav>
    </aside>
  );
};

export default Header;
