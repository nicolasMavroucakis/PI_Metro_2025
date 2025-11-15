import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detecta mudanças no tamanho da tela
  React.useEffect(() => {
    const handleResize = () => {
      // Breakpoint para telas "não-desktop"
      const isNotDesktop = window.innerWidth < 1025;
      
      setIsMobile(isNotDesktop);
      
      // Em desktop, a sidebar começa aberta.
      if (isNotDesktop) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Chama uma vez na inicialização

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggle = () => {
    setIsOpen(prev => !prev);
  };

  const open = () => {
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  // Fecha sidebar automaticamente em mobile após navegação
  const closeOnMobile = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const value = {
    isOpen,
    isMobile,
    toggle,
    open,
    close,
    closeOnMobile,
    // Propriedades úteis para CSS
    sidebarWidth: isOpen ? (isMobile ? '100%' : '280px') : '70px',
    contentMargin: isMobile ? '0' : (isOpen ? '280px' : '70px')
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
