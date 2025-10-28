# 👥 Sistema de Gerenciamento de Usuários (Admin) - WEB

Sistema completo de gerenciamento de usuários no sistema web, com permissões de administrador.

## 🎯 Funcionalidades

### ✅ Visível Apenas para Admin
- O menu "Gerenciamento de Usuários" aparece **apenas** se o usuário logado tiver `isAdmin: true`
- Proteção em nível de interface (redirecionamento automático)
- Validação de permissões no frontend

### 👥 Gerenciamento Completo (CRUD)
- **Criar** novo usuário
- **Listar** todos os usuários do sistema
- **Editar** informações de usuário existente
- **Deletar** usuário (exceto a própria conta)

### 📝 Campos Gerenciáveis
- Username (não editável após criação)
- Senha (hash com bcrypt)
- Email
- Nome Completo
- Função (role)
- É Administrador? (isAdmin)
- Usuário Ativo? (isActive)

## 🏗️ Arquitetura

### Estrutura de Usuário no DynamoDB

```javascript
{
  username: "joao.silva",       // Primary Key (string)
  password: "hash_bcrypt...",   // Hash bcrypt (string)
  email: "joao@exemplo.com",    // Email (string)
  name: "João Silva",           // Nome completo (string)
  role: "admin",                // Função (string)
  isAdmin: true,                // É admin? (boolean)
  isActive: true,               // Ativo? (boolean)
  createdAt: "2025-01-15T10:30:00.000Z",  // ISO string
  updatedAt: "2025-01-15T10:30:00.000Z",  // ISO string
  lastLogin: "2025-01-15T14:20:00.000Z"   // ISO string | null
}
```

### Arquivos Criados/Modificados

#### 1. **userService.js** (Expandido)
Funções admin adicionadas:
- `getAllUsers()` - Lista todos os usuários (sem senhas)
- `createUserAdmin(userData)` - Cria novo usuário com hash de senha
- `updateUserAdmin(username, updates)` - Atualiza usuário (campos seletivos)
- `deleteUserAdmin(username)` - Deleta usuário

#### 2. **Users.jsx** (Novo)
Página completa de gerenciamento:
- Lista de usuários em tabela
- Botão "Novo Usuário"
- Modal de criação/edição com formulário completo
- Confirmação antes de deletar
- Proteção: redireciona se não for admin

#### 3. **Users.css** (Novo)
Estilos profissionais:
- Layout responsivo
- Tabela interativa
- Modal bonito
- Badges de status

#### 4. **App.js** (Modificado)
Rota adicionada:
```javascript
<Route path="/users" element={<Users />} />
```

#### 5. **Home.jsx** (Modificado)
Menu condicional:
```javascript
const user = JSON.parse(localStorage.getItem('user') || '{}');
const menuItems = [
  { icon: '🏠', label: 'Home', active: true, path: '/home' },
  // Item condicional - apenas para admin
  ...(user.isAdmin ? [{ icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' }] : []),
  { icon: '📊', label: 'Relatórios', path: '/reports' },
  ...
];
```

#### 6. **create-admin.js** (Novo Script)
Script Node.js para criar usuário admin inicial via terminal

## 🚀 Setup Inicial

### 1. Criar Usuário Admin Inicial

```bash
cd /Users/nicolasmavroucakis/Desenvolvimento/PI_Metro_2025/web
node scripts/create-admin.js
```

O script pedirá:
- Username (padrão: admin)
- Senha (mínimo 6 caracteres)
- Email
- Nome completo (opcional)

**Exemplo:**
```
========================================
   Criar Usuário Administrador - WEB
========================================

Username (admin): admin
Senha (mínimo 6 caracteres): admin123
Email: admin@metrosp.com.br
Nome completo (opcional): Administrador Sistema

✅ Usuário administrador criado com sucesso!

Detalhes:
   Username: admin
   Email: admin@metrosp.com.br
   Nome: Administrador Sistema
   Função: admin
   Administrador: Sim
   Ativo: Sim

💡 Você pode fazer login no sistema web com essas credenciais.
   O menu "Gerenciamento de Usuários" estará visível apenas para este usuário.
```

### 2. Fazer Login no Web

1. Acesse http://localhost:3000
2. Faça login com as credenciais criadas:
   - Username: `admin`
   - Senha: `admin123`
3. Você verá o menu **"👥 Gerenciamento de Usuários"**

## 📱 Como Usar

### Criar Novo Usuário

1. No menu lateral, clique em **"👥 Gerenciamento de Usuários"**
2. Clique em **"➕ Novo Usuário"**
3. Preencha o formulário:
   - **Username*** (obrigatório, não pode mudar depois)
   - **Senha*** (obrigatório, min 6 caracteres)
   - **Email*** (obrigatório)
   - Nome Completo (opcional)
   - Função (ex: user, manager, supervisor)
   - ☑️ **É Administrador?** (checkbox)
   - ☑️ **Usuário Ativo?** (checkbox)
4. Clique em **"Criar"**

✅ Usuário criado e pronto para login!

### Editar Usuário

1. Na tabela, clique no ícone **"✏️"** do usuário
2. Modifique os campos desejados:
   - Username **não pode** ser editado (campo bloqueado)
   - Senha: deixe vazio para não alterar
   - Outros campos: edite livremente
3. Clique em **"Salvar"**

### Deletar Usuário

1. Na tabela, clique no ícone **"🗑️"** do usuário
2. Confirme a exclusão
3. ⚠️ **Você não pode deletar sua própria conta** (botão desabilitado)

### Visualizar Informações

A tabela mostra:
- 👤 Username (com badge 👑 se admin)
- Nome completo
- 📧 Email
- 📋 Função (role badge)
- 🟢 Status (Ativo/Inativo)
- 🕐 Último login
- ⚙️ Ações (Editar/Excluir)

## 🔐 Segurança

### Proteções Implementadas

✅ **Interface**
- Menu visível apenas se `user.isAdmin === true`
- Redirecionamento se não-admin acessa `/users`

✅ **Backend**
- Senhas com hash bcrypt (10 rounds)
- Senhas nunca retornadas nas consultas
- Validações de campos obrigatórios

✅ **Funcionalidades**
- Admin não pode deletar a própria conta
- Confirmação antes de deletar
- Validação de email, username, senha

### Melhores Práticas

1. **Senha Forte**
   - Mínimo 6 caracteres (recomendado: 8+)
   - Combine letras, números e símbolos

2. **Gestão de Admins**
   - Minimize o número de admins
   - Revogue acesso de ex-funcionários (desative ao invés de deletar)

3. **Auditoria**
   - `createdAt` e `updatedAt` registram mudanças
   - `lastLogin` rastreia último acesso

## 🎨 Interface

### Página Principal

```
┌─────────────────────────────────────────────┐
│ 👥 Gerenciamento de Usuários                │
│ Total: 5 usuários                            │
│                                              │
│ [➕ Novo Usuário]                            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Username  │ Nome     │ Email          │ Função │ Status  │ ... │
├─────────────────────────────────────────────────────────────────┤
│ admin 👑  │ Admin    │ admin@...      │ admin  │ 🟢 Ativo │ ... │
│ joao      │ João S.  │ joao@...       │ user   │ 🟢 Ativo │ ... │
└─────────────────────────────────────────────────────────────────┘
```

### Modal de Criação/Edição

```
┌─────────────────────────────────────┐
│ ➕ Novo Usuário              [✕]    │
├─────────────────────────────────────┤
│                                      │
│ Username *                          │
│ [_____________________________]    │
│                                      │
│ Senha *                             │
│ [_____________________________]    │
│                                      │
│ Email *                             │
│ [_____________________________]    │
│                                      │
│ Nome Completo                       │
│ [_____________________________]    │
│                                      │
│ Função                              │
│ [_____________________________]    │
│                                      │
│ ☑ É Administrador?                  │
│ ☑ Usuário Ativo?                    │
│                                      │
│ [Cancelar]           [Criar]        │
└─────────────────────────────────────┘
```

## 🧪 Testando

### Cenário 1: Usuário Comum

1. Faça login como usuário comum (não-admin)
2. Verifique que o menu "Gerenciamento de Usuários" **não aparece**
3. Tente acessar `/users` diretamente
4. Deve ser redirecionado para `/home` com alert de acesso negado

### Cenário 2: Usuário Admin

1. Faça login como admin
2. Verifique que o menu "Gerenciamento de Usuários" **aparece**
3. Clique no menu
4. Deve ver lista de todos os usuários

### Cenário 3: CRUD Completo

1. **Create:** Crie novo usuário "teste"
2. **Read:** Veja "teste" na tabela
3. **Update:** Edite email de "teste"
4. **Delete:** Delete usuário "teste"

## ⚠️ Troubleshooting

### Menu não aparece

**Problema:** Logado mas não vejo "Gerenciamento de Usuários"  
**Solução:** 
1. Verifique que `user.isAdmin === true` no DynamoDB
2. Faça logout e login novamente
3. Execute `create-admin.js` novamente se necessário

### Erro ao criar usuário

**Problema:** "Usuário já existe"  
**Solução:** Username deve ser único. Escolha outro username.

**Problema:** "Erro ao criar usuário"  
**Solução:** 
1. Verifique conexão com AWS
2. Verifique permissões DynamoDB no `.env`
3. Verifique logs no console do navegador

### Não consigo editar username

**Motivo:** Username é a chave primária (Primary Key) no DynamoDB e não pode ser alterada.  
**Solução:** Se precisa mudar username, crie novo usuário e delete o antigo.

## 📊 Estrutura DynamoDB

**Tabela:** `metro-users`

**Primary Key:**
- `username` (String, HASH)

**Atributos:**
- password (String, hash bcrypt)
- email (String)
- name (String)
- role (String)
- isAdmin (Boolean)
- isActive (Boolean)
- createdAt (String, ISO 8601)
- updatedAt (String, ISO 8601)
- lastLogin (String, ISO 8601 | null)

## 🔮 Melhorias Futuras

### Curto Prazo
- [ ] Busca/filtro de usuários
- [ ] Ordenação por nome/data/email
- [ ] Paginação para muitos usuários
- [ ] Export lista de usuários (CSV)

### Médio Prazo
- [ ] Histórico de mudanças (audit log)
- [ ] Permissões granulares (RBAC)
- [ ] Upload de foto de perfil
- [ ] Notificações por email
- [ ] Validação de força de senha

### Longo Prazo
- [ ] Autenticação 2FA
- [ ] Single Sign-On (SSO)
- [ ] Integração com Active Directory
- [ ] Dashboard de atividade dos usuários
- [ ] Logs de auditoria detalhados

## 📚 Documentação Relacionada

- [README.md](./README.md) - Setup geral do projeto
- [DYNAMODB_SETUP.md](./DYNAMODB_SETUP.md) - Setup do DynamoDB
- [README_COMPARACAO_BIM.md](./README_COMPARACAO_BIM.md) - Comparação BIM com IA
- [README_RELATORIOS.md](./README_RELATORIOS.md) - Sistema de relatórios

## ✅ Conclusão

Sistema completo e funcional de gerenciamento de usuários com:
- ✅ Interface intuitiva e responsiva
- ✅ Permissões baseadas em função
- ✅ CRUD completo
- ✅ Segurança robusta (bcrypt, validações)
- ✅ Visibilidade condicional no menu
- ✅ Script de criação de admin
- ✅ Documentação completa

---

**Desenvolvido para:** PI Metro 2025  
**Plataforma:** React.js Web  
**Versão:** 1.0.0  
**Data:** Janeiro 2025


