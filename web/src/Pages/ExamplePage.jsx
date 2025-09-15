import React from 'react';
import Layout from '../components/Layout';
import { useSidebar } from '../contexts/SidebarContext';

function ExamplePage() {
  const { closeOnMobile } = useSidebar();

  // Menu items específicos para esta página
  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '📊', label: 'Relatórios', active: true, path: '/reports' },
    { icon: '👥', label: 'Usuários', path: '/users' },
    { 
      icon: '⚙️', 
      label: 'Configurações', 
      path: '/settings',
      onClick: () => {
        console.log('Navegando para configurações...');
        closeOnMobile(); // Fecha sidebar em mobile após clique
      }
    }
  ];

  return (
    <Layout 
      menuItems={menuItems}
      sidebarProps={{ 
        adminName: 'ADMIN RELATÓRIOS',
        showMetroBranding: true 
      }}
    >
      <header style={{ 
        background: 'white', 
        padding: '20px', 
        borderBottom: '1px solid #eee' 
      }}>
        <h1>Página de Exemplo</h1>
        <p>Esta página demonstra como usar a Sidebar reutilizável</p>
      </header>
      
      <main style={{ 
        flex: 1, 
        padding: '20px', 
        overflow: 'auto' 
      }}>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <h2>Como usar a Sidebar reutilizável:</h2>
          
          <h3>1. Importar os componentes:</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`import Layout from '../components/Layout';
import { useSidebar } from '../contexts/SidebarContext';`}
          </pre>

          <h3>2. Definir menu items:</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`const menuItems = [
  { icon: '🏠', label: 'Home', path: '/home' },
  { icon: '📊', label: 'Relatórios', active: true, path: '/reports' },
  { 
    icon: '⚙️', 
    label: 'Config', 
    onClick: () => console.log('Clicou!') 
  }
];`}
          </pre>

          <h3>3. Usar o Layout:</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`<Layout 
  menuItems={menuItems}
  sidebarProps={{ adminName: 'CUSTOM ADMIN' }}
>
  {/* Seu conteúdo aqui */}
</Layout>`}
          </pre>

          <h3>Funcionalidades disponíveis:</h3>
          <ul>
            <li>✅ Sidebar responsiva (desktop/mobile)</li>
            <li>✅ Estado global compartilhado</li>
            <li>✅ Menu items customizáveis</li>
            <li>✅ Callbacks para navegação</li>
            <li>✅ Overlay automático em mobile</li>
            <li>✅ Animações e transições</li>
            <li>✅ Acessibilidade completa</li>
          </ul>
        </div>
      </main>
    </Layout>
  );
}

export default ExamplePage;
