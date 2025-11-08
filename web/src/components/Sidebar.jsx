import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import MetroLogo from '../assets/metro.png';
import { 
  MdHome,
  MdPeople,
  MdAssessment,
  MdAddCircleOutline,
  MdChevronRight
} from 'react-icons/md';

const Sidebar = ({ 
  menuItems = [],
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  className = '',
  showMetroBranding = true,
  adminName = 'ADMIN',
  showToggleInSidebar = true
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
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' }
  ];

  const items = menuItems.length > 0 ? menuItems : defaultMenuItems;

  const renderIcon = (item) => {
    // Se já veio um React element, usa diretamente
    if (React.isValidElement(item.icon)) return item.icon;

    const key = (item.label || '').toLowerCase();
    switch (key) {
      case 'home':
        return <MdHome size={26} />;
      case 'gerenciamento de usuários':
      case 'usuários':
      case 'usuarios':
        return <MdPeople size={26} />;
      case 'relatórios':
      case 'relatorios':
        return <MdAssessment size={26} />;
      case 'adicionar projeto':
      case 'novo projeto':
        return <MdAddCircleOutline size={26} />;
      default:
        return <MdChevronRight size={26} />;
    }
  };

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
        {showToggleInSidebar && (
          <button className="menu-toggle" onClick={onToggle} aria-label="Toggle menu">
            ☰
          </button>
        )}
        <div className="admin-section">
          <div className="admin-avatar">
            <img src={MetroLogo} alt="Admin Avatar" />
          </div>
          <h3 className={`admin-name ${isOpen ? 'visible' : 'hidden'}`}>{adminName}</h3>
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
            <span className="nav-icon">{renderIcon(item)}</span>
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
