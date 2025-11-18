import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';
import MetroLogo from '../assets/metro.png';
import { useSidebar } from '../contexts/SidebarContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Home,
  Users,
  FileText,
  PlusCircle,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

const Sidebar = ({ 
  menuItems = [],
  className = '',
  showMetroBranding = true,
  adminName = 'ADMIN'
}) => {
  const navigate = useNavigate();
  // Usar o estado e funções do contexto
  const { isOpen, closeOnMobile } = useSidebar();
  const { theme, toggleTheme, isDark } = useTheme();
  
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
        return <Home size={22} strokeWidth={2} />;
      case 'gerenciamento de usuários':
      case 'usuários':
      case 'usuarios':
        return <Users size={22} strokeWidth={2} />;
      case 'relatórios':
      case 'relatorios':
        return <FileText size={22} strokeWidth={2} />;
      case 'adicionar projeto':
      case 'novo projeto':
        return <PlusCircle size={22} strokeWidth={2} />;
      default:
        return <ChevronRight size={22} strokeWidth={2} />;
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

    // Fecha a sidebar em mobile após o clique
    closeOnMobile();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'} ${className}`}>
      <div className="sidebar-header">
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
            <span className={`nav-label ${isOpen ? 'visible' : 'hidden'}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Toggle de Tema */}
      <div className="sidebar-theme-toggle">
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          <span className="nav-icon">
            {isDark ? <Sun size={22} strokeWidth={2} /> : <Moon size={22} strokeWidth={2} />}
          </span>
          <span className={`nav-label ${isOpen ? 'visible' : 'hidden'}`}>
            {isDark ? 'Modo Claro' : 'Modo Escuro'}
          </span>
        </button>
      </div>

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
    </aside>
  );
};

export default Sidebar;
