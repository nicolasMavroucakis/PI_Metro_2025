# Configuração do DynamoDB para Sistema de Login/Registro

Este guia explica como configurar e usar o sistema de autenticação com DynamoDB no projeto Metro SP.

## 📋 Pré-requisitos

1. **Conta AWS** com acesso ao DynamoDB
2. **Credenciais AWS** (Access Key ID e Secret Access Key)
3. **Node.js** instalado no sistema

## 🔧 Configuração Inicial

### 1. Configurar Credenciais AWS

Crie um arquivo `.env` na pasta `web/` baseado no arquivo `env.example`:

```bash
cp env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
REACT_APP_AWS_REGION=us-east-1
REACT_APP_AWS_ACCESS_KEY_ID=sua_access_key_aqui
REACT_APP_AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui
REACT_APP_USERS_TABLE=metro-users
```

### 2. Instalar Dependências

```bash
npm install aws-sdk bcryptjs
```

### 3. Criar Tabela no DynamoDB

Execute o script de setup:

```bash
# Configurar variáveis de ambiente para o script
export AWS_ACCESS_KEY_ID=sua_access_key_aqui
export AWS_SECRET_ACCESS_KEY=sua_secret_key_aqui
export AWS_REGION=us-east-1
export USERS_TABLE=metro-users

# Executar o script
node scripts/setup-dynamodb.js
```

## 🗂️ Estrutura da Tabela

A tabela `metro-users` será criada com a seguinte estrutura:

### Chave Primária
- **username** (String) - Partition Key

### Índice Secundário Global
- **EmailIndex** - Permite busca por email

### Atributos
- `username` - Nome de usuário único
- `email` - E-mail do usuário
- `password` - Senha criptografada (bcrypt)
- `name` - Nome completo
- `createdAt` - Data de criação
- `updatedAt` - Data da última atualização
- `lastLogin` - Data do último login
- `isActive` - Status ativo/inativo

## 🚀 Como Usar

### Registro de Usuário

1. Acesse `/register`
2. Preencha os campos:
   - Nome completo
   - Nome de usuário (único)
   - E-mail (único)
   - Senha (mínimo 6 caracteres)
   - Confirmação de senha
3. Clique em "Cadastrar"

### Login

1. Acesse `/` (página inicial)
2. Digite seu nome de usuário e senha
3. Clique em "Entrar"

## 🔒 Segurança

- **Senhas** são criptografadas usando bcrypt com salt rounds = 10
- **Validações** no frontend e backend
- **Verificação** de usuário único por username e email
- **Tratamento** de erros com mensagens amigáveis

## 📊 Operações Disponíveis

### UserService

```javascript
import userService from '../services/userService';

// Criar usuário
const result = await userService.createUser({
  name: 'João Silva',
  username: 'joao.silva',
  email: 'joao@email.com',
  password: 'minhasenha123'
});

// Autenticar usuário
const auth = await userService.authenticateUser('joao.silva', 'minhasenha123');

// Buscar por username
const user = await userService.getUserByUsername('joao.silva');

// Buscar por email
const user = await userService.getUserByEmail('joao@email.com');
```

## 🛠️ Troubleshooting

### Erro: "Credenciais AWS não encontradas"
- Verifique se o arquivo `.env` está criado
- Confirme se as variáveis estão corretas
- Reinicie o servidor React

### Erro: "Tabela não existe"
- Execute o script `setup-dynamodb.js`
- Verifique se a região AWS está correta
- Aguarde alguns minutos após criar a tabela

### Erro: "Access Denied"
- Verifique se as credenciais AWS têm permissão para DynamoDB
- Confirme se a região está correta

### Problemas de CORS
- Se estiver usando em produção, configure CORS adequadamente
- Para desenvolvimento local, o problema não deve ocorrer

## 💡 Dicas

1. **Desenvolvimento**: Use o DynamoDB Local para testes
2. **Produção**: Configure IAM roles em vez de credenciais hardcoded
3. **Backup**: Configure backup automático da tabela
4. **Monitoramento**: Use CloudWatch para monitorar a performance

## 📁 Arquivos Relacionados

- `src/config/aws-config.js` - Configuração AWS
- `src/services/userService.js` - Serviço de usuários
- `src/Pages/Login.jsx` - Tela de login
- `src/Pages/Register.jsx` - Tela de registro
- `scripts/setup-dynamodb.js` - Script de configuração
- `env.example` - Exemplo de configuração

## 🔄 Próximos Passos

1. Implementar recuperação de senha
2. Adicionar autenticação JWT
3. Implementar roles/permissões
4. Adicionar logs de auditoria
5. Implementar 2FA (autenticação de dois fatores)
