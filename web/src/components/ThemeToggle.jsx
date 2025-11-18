import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

/**
 * Componente de Toggle de Tema - Pode ser usado em qualquer lugar
 * 
 * Exemplo de uso:
 * ```jsx
 * import ThemeToggle from './components/ThemeToggle';
 * 
 * function MeuComponente() {
 *   return (
 *     <div>
 *       <ThemeToggle />
 *     </div>
 *   );
 * }
 * ```
 */
const ThemeToggle = ({ showLabel = true, size = 'medium', variant = 'default' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizes = {
    small: 16,
    medium: 20,
    large: 24
  };

  const iconSize = sizes[size] || sizes.medium;

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle-button theme-toggle-${variant} theme-toggle-${size}`}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <span className="theme-toggle-icon">
        {isDark ? (
          <Sun size={iconSize} strokeWidth={2} />
        ) : (
          <Moon size={iconSize} strokeWidth={2} />
        )}
      </span>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;

