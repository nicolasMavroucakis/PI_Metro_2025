import React from 'react';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';
import './Layout.css';

const Layout = ({ 
  children, 
  menuItems,
  showSidebar = true,
  className = '',
  sidebarProps = {}
}) => {
  const { isOpen, toggle, isMobile } = useSidebar();

  // Overlay para mobile quando sidebar está aberta
  const renderOverlay = () => {
    if (isMobile && isOpen) {
      return (
        <div 
          className="sidebar-overlay active" 
          onClick={toggle}
          aria-label="Close sidebar"
        />
      );
    }
    return null;
  };

  return (
    <div className={`layout-container ${className}`}>
      {renderOverlay()}

      {/* Botão de toggle fixo fora da sidebar para não sofrer com o transform da animação */}
      <button 
        className="menu-toggle" 
        onClick={toggle} 
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        ☰
      </button>
      
      {showSidebar && (
        <Sidebar
          menuItems={menuItems}
          isOpen={isOpen}
          onToggle={toggle}
          showToggleInSidebar={false}
          {...sidebarProps}
        />
      )}
      
      <div className={`layout-content ${isOpen && !isMobile ? 'sidebar-open' : 'sidebar-closed'}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
