import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import './ThemeExample.css';

/**
 * EXEMPLO DE USO DO SISTEMA DE TEMAS
 * 
 * Este componente demonstra como usar o sistema de temas
 * em seus próprios componentes.
 */
function ThemeExample() {
  const { theme, isDark, isLight } = useTheme();

  return (
    <div className="theme-example-container">
      <header className="theme-example-header">
        <h1>Exemplo de Sistema de Temas</h1>
        <ThemeToggle />
      </header>

      <main className="theme-example-content">
        <section className="theme-example-section">
          <h2>Informações do Tema</h2>
          <div className="theme-example-card">
            <p><strong>Tema Atual:</strong> {theme}</p>
            <p><strong>É Modo Escuro?</strong> {isDark ? 'Sim' : 'Não'}</p>
            <p><strong>É Modo Claro?</strong> {isLight ? 'Sim' : 'Não'}</p>
          </div>
        </section>

        <section className="theme-example-section">
          <h2>Variantes de Toggle</h2>
          <div className="theme-example-toggles">
            <ThemeToggle variant="default" size="small" showLabel={true} />
            <ThemeToggle variant="default" size="medium" showLabel={true} />
            <ThemeToggle variant="default" size="large" showLabel={true} />
            <ThemeToggle variant="primary" size="medium" showLabel={true} />
            <ThemeToggle variant="minimal" size="medium" showLabel={false} />
          </div>
        </section>

        <section className="theme-example-section">
          <h2>Cores do Sistema</h2>
          <div className="theme-example-colors">
            <div className="color-demo color-primary">
              <span>Primary</span>
            </div>
            <div className="color-demo color-secondary">
              <span>Secondary</span>
            </div>
            <div className="color-demo color-success">
              <span>Success</span>
            </div>
            <div className="color-demo color-warning">
              <span>Warning</span>
            </div>
            <div className="color-demo color-danger">
              <span>Danger</span>
            </div>
            <div className="color-demo color-info">
              <span>Info</span>
            </div>
          </div>
        </section>

        <section className="theme-example-section">
          <h2>Componentes com Tema</h2>
          
          <div className="theme-example-card">
            <h3>Card de Exemplo</h3>
            <p>Este é um card que automaticamente se adapta ao tema.</p>
            <button className="theme-example-button primary">
              Botão Primário
            </button>
            <button className="theme-example-button secondary">
              Botão Secundário
            </button>
          </div>

          <div className="theme-example-form">
            <h3>Formulário de Exemplo</h3>
            <div className="form-group">
              <label htmlFor="example-input">Nome:</label>
              <input
                id="example-input"
                type="text"
                placeholder="Digite seu nome"
                className="theme-example-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="example-textarea">Descrição:</label>
              <textarea
                id="example-textarea"
                placeholder="Digite uma descrição"
                className="theme-example-textarea"
                rows={4}
              />
            </div>
            <div className="form-group">
              <label htmlFor="example-select">Opção:</label>
              <select id="example-select" className="theme-example-select">
                <option>Opção 1</option>
                <option>Opção 2</option>
                <option>Opção 3</option>
              </select>
            </div>
          </div>
        </section>

        <section className="theme-example-section">
          <h2>Código de Exemplo</h2>
          <pre className="theme-example-code">
{`// 1. Importar o hook
import { useTheme } from '../contexts/ThemeContext';

// 2. Usar no componente
function MeuComponente() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <div>
      <p>Tema: {theme}</p>
      <button onClick={toggleTheme}>
        Alternar Tema
      </button>
    </div>
  );
}

// 3. Usar variáveis CSS
.meu-elemento {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}`}
          </pre>
        </section>
      </main>
    </div>
  );
}

export default ThemeExample;

