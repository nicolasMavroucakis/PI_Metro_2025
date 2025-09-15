import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import MetroLogo from '../assets/metro.png';

const Sidebar = ({ 
  menuItems = [],
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  className = '',
  showMetroBranding = true,
  adminName = 'ADMIN'
}) => {
  // Estado interno se não for controlado externamente
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const navigate = useNavigate();
  
  // Usa props controladas se fornecidas, senão usa estado interno
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const onToggle = controlledOnToggle || (() => setInternalIsOpen(!internalIsOpen));

  const defaultMenuItems = [
    { icon: '🏠', label: 'Home', active: true, path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' },
    { icon: '👤', label: 'Usuário', path: '/profile' }
  ];

  const items = menuItems.length > 0 ? menuItems : defaultMenuItems;

  const handleMenuItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    
    // Navega para a rota se ela existir
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'} ${className}`}>
      <div className="sidebar-header">
        <button className="menu-toggle" onClick={onToggle} aria-label="Toggle menu">
          ☰
        </button>
        <div className="admin-section">
          <div className="admin-avatar">
            <img src={MetroLogo} alt="Admin Avatar" />
          </div>
          {isOpen && <h3>{adminName}</h3>}
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => handleMenuItemClick(item)}
            className={`nav-item ${item.active ? 'active' : ''}`}
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            {isOpen && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      {showMetroBranding && (
        <div className="sidebar-footer">
          <div className="metro-branding">
            <img src={MetroLogo} alt="Metro SP" />
            {isOpen && (
              <div>
                <div className="metro-title">Metrô SP</div>
                <div className="metro-subtitle">Canteiro de Obras</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
