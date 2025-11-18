# 🌓 Sistema de Modo Escuro - Metro SP

## Visão Geral

Sistema completo de tema claro/escuro implementado para o sistema de gestão de obras do Metrô de São Paulo. O modo escuro foi especialmente projetado para uso em ambientes com pouca iluminação, com alto contraste e legibilidade otimizada.

## 🎯 Características

### Modo Claro (Padrão)
- Interface limpa e profissional
- Cores vibrantes e alegres
- Ideal para ambientes bem iluminados
- Gradientes azuis no sidebar

### Modo Escuro
- Tons escuros otimizados para ambientes com pouca luz
- Alto contraste para melhor legibilidade
- Reduz fadiga ocular durante uso prolongado
- Cores mais vibrantes para destaque visual
- Design específico para trabalho noturno ou em túneis

## 📁 Arquitetura

### Arquivos Principais

```
web/src/
├── contexts/
│   └── ThemeContext.jsx          # Contexto React para gerenciar o tema
├── Style/
│   ├── theme.css                 # Variáveis CSS para ambos os temas
│   ├── theme-overrides.css       # Overrides globais para componentes
│   └── ProjectDetails-theme.css  # Tema específico para ProjectDetails
└── components/
    └── Sidebar.jsx               # Toggle de tema no sidebar
```

### Como Funciona

1. **ThemeContext**: Gerencia o estado do tema (light/dark)
2. **localStorage**: Persiste a escolha do usuário
3. **data-theme**: Atributo no `<html>` que ativa as variáveis CSS corretas
4. **Variáveis CSS**: Sistema de variáveis que muda automaticamente

## 🚀 Como Usar

### Para Usuários

1. Navegue até qualquer página do sistema
2. Na sidebar, procure o botão com ícone de Sol ☀️ (modo claro) ou Lua 🌙 (modo escuro)
3. Clique para alternar entre os modos
4. A preferência é salva automaticamente

### Para Desenvolvedores

#### Usando o Hook de Tema

```jsx
import { useTheme } from '../contexts/ThemeContext';

function MeuComponente() {
  const { theme, toggleTheme, isDark, isLight } = useTheme();
  
  return (
    <div>
      <p>Tema atual: {theme}</p>
      <button onClick={toggleTheme}>
        Alternar Tema
      </button>
      {isDark && <p>Modo escuro ativo!</p>}
    </div>
  );
}
```

#### Usando Variáveis CSS

```css
.meu-componente {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
}

.meu-botao {
  background: var(--color-primary);
  color: var(--text-inverse);
}

.meu-botao:hover {
  background: var(--color-primary-hover);
}
```

## 🎨 Variáveis Disponíveis

### Backgrounds
- `--bg-primary`: Fundo principal da página
- `--bg-secondary`: Fundo secundário
- `--bg-tertiary`: Fundo terciário
- `--bg-card`: Fundo de cards
- `--bg-modal`: Fundo de modais
- `--bg-input`: Fundo de inputs
- `--bg-hover`: Fundo em hover
- `--bg-sidebar`: Fundo da sidebar

### Textos
- `--text-primary`: Texto principal
- `--text-secondary`: Texto secundário
- `--text-tertiary`: Texto terciário
- `--text-inverse`: Texto invertido (branco/preto)
- `--text-muted`: Texto esmaecido

### Bordas
- `--border-color`: Cor de borda padrão
- `--border-light`: Borda clara
- `--border-medium`: Borda média
- `--border-dark`: Borda escura

### Cores de Ação
- `--color-primary`: Azul principal
- `--color-secondary`: Verde secundário
- `--color-danger`: Vermelho de perigo
- `--color-warning`: Laranja de aviso
- `--color-info`: Azul de informação
- `--color-success`: Verde de sucesso

Cada cor tem variantes:
- `-hover`: Versão para hover
- `-light`: Versão clara para fundos

### Sombras
- `--shadow-sm`: Sombra pequena
- `--shadow-md`: Sombra média
- `--shadow-lg`: Sombra grande
- `--shadow-xl`: Sombra extra grande
- `--shadow-card`: Sombra para cards
- `--shadow-hover`: Sombra em hover

### Outros
- `--overlay-bg`: Fundo de overlay/backdrop
- `--status-progress`: Cor de progresso
- `--status-warning`: Cor de aviso
- `--status-danger`: Cor de perigo
- `--status-info`: Cor de informação

## 📝 Boas Práticas

### ✅ Faça

- Use variáveis CSS sempre que possível
- Teste em ambos os modos ao criar novos componentes
- Mantenha cores funcionais (success, error, warning) consistentes
- Use `--text-primary` para textos principais
- Use `--bg-card` para fundos de cards e containers

### ❌ Não Faça

- Não use cores hardcoded (#333, #fff, etc)
- Não force cores específicas que não funcionam em modo escuro
- Não ignore o contraste em modo escuro
- Não use transições em elementos que não devem animar

## 🔧 Adicionando Novos Componentes

### CSS Modular

```css
/* MeuComponente.module.css */
.container {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 20px;
  border-radius: 8px;
}

.title {
  color: var(--text-primary);
  font-size: 18px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}
```

### CSS Global

Se precisar adicionar estilos globais, use `theme-overrides.css`:

```css
/* theme-overrides.css */
.novo-componente {
  background: var(--bg-card) !important;
  color: var(--text-primary) !important;
}
```

## 🐛 Troubleshooting

### Problema: Cores não mudam no modo escuro
**Solução**: Verifique se está usando variáveis CSS ao invés de cores hardcoded

### Problema: Componente fica ilegível em modo escuro
**Solução**: Use `--text-primary` para texto e `--bg-card` para fundo

### Problema: Transições muito lentas
**Solução**: Adicione a classe `.no-transition` ao elemento

### Problema: Imagens muito brilhantes em modo escuro
**Solução**: As imagens já tem filtro automático. Se precisar desativar, adicione classe ou atributo `alt` com "logo"

## 🎯 Otimizações para Ambientes Escuros

### Alto Contraste
- Textos principais: `#e8e8e8` (quase branco)
- Backgrounds: `#121212` a `#2a2a2a` (cinzas escuros)
- Bordas: mais visíveis que no modo claro

### Cores Vibrantes
- Azul: `#42a5f5` (mais claro que no modo claro)
- Verde: `#66bb6a`
- Vermelho: `#ef5350`
- Laranja: `#ffa726`

### Redução de Fadiga
- Scrollbars personalizadas
- Sombras mais sutis
- Transições suaves entre temas
- Redução de brilho em imagens

## 📊 Suporte

### Navegadores
- ✅ Chrome/Edge (versão 90+)
- ✅ Firefox (versão 88+)
- ✅ Safari (versão 14+)

### Acessibilidade
- ✅ Suporte a `prefers-reduced-motion`
- ✅ Suporte a `prefers-contrast: high`
- ✅ Scrollbars acessíveis em ambos os modos
- ✅ Focus states visíveis

## 🚀 Performance

- Usa variáveis CSS nativas (sem JS para estilização)
- Transições com hardware acceleration
- localStorage para persistência (< 1KB)
- Sem re-renders desnecessários

## 📱 Mobile

O toggle de tema funciona perfeitamente em mobile, aparecendo na sidebar quando em telas maiores que 1024px.

## 🔄 Atualizações Futuras

Possíveis melhorias:
- [ ] Modo automático baseado em horário
- [ ] Detecção de preferência do sistema (`prefers-color-scheme`)
- [ ] Temas personalizados por usuário
- [ ] Preview de tema antes de aplicar

## 📞 Suporte

Para dúvidas ou problemas, contate a equipe de desenvolvimento.

---

**Desenvolvido para o Metrô de São Paulo** 🚇
*Sistema de Gestão de Obras - Canteiro Digital*

