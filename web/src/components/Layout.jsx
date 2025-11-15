import React from 'react';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar'; // Importar o novo componente
import { useSidebar } from '../contexts/SidebarContext';
import './Layout.css';
import { Menu } from 'lucide-react';

const Layout = ({ 
  children, 
  menuItems,
  showSidebar = true,
  className = '',
  sidebarProps = {}
}) => {
  const { isOpen, toggle, isMobile } = useSidebar();

  return (
    <div className={`layout-container ${className}`}>
      {/* Botão de toggle hamburger, visível apenas em desktop */}
      {showSidebar && !isMobile && (
        <button 
          className="menu-toggle" 
          onClick={toggle} 
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <Menu color="black" />
        </button>
      )}

      {/* Renderização condicional da navegação */}
      {showSidebar && (
        isMobile 
          ? <BottomNavBar menuItems={menuItems} /> 
          : <Sidebar menuItems={menuItems} {...sidebarProps} />
      )}
      
      <div 
        className={`
          layout-content 
          ${!isMobile && (isOpen ? 'sidebar-open' : 'sidebar-closed')}
        `}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
