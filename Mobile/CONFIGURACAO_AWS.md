# 🔧 CONFIGURAÇÃO AWS - METRO SP MOBILE

## 📍 ONDE COLOCAR AS CREDENCIAIS AWS

### 🎯 LOCALIZAÇÃO DO ARQUIVO
```
Mobile/
└── config/
    ├── credentials.js          ← SUAS CREDENCIAIS AQUI
    ├── credentials.example.js  ← EXEMPLO (não editar)
    └── aws-config.js          ← CONFIGURAÇÃO (não editar)
```

### 📝 PASSO A PASSO

#### 1. **Localizar o arquivo de credenciais**
   - Navegue até: `Mobile/config/credentials.js`
   - Se não existir, copie `credentials.example.js` como `credentials.js`

#### 2. **Editar suas credenciais AWS**
   Abra o arquivo `Mobile/config/credentials.js` e substitua:

   ```javascript
   export const AWS_CREDENTIALS = {
     region: 'sa-east-1',
     
     // 🔥 SUBSTITUA ESTAS LINHAS PELAS SUAS CREDENCIAIS REAIS:
     accessKeyId: 'SUA_ACCESS_KEY_AQUI',
     secretAccessKey: 'SUA_SECRET_KEY_AQUI',
     
     // ✅ NÃO ALTERAR (tabelas e bucket):
     usersTable: 'metro-users',
     projectsTable: 'metro-projects',
     s3Bucket: 'metrosp2025maua'
   };
   ```

#### 3. **Exemplo com credenciais reais**
   ```javascript
   export const AWS_CREDENTIALS = {
     region: 'sa-east-1',
     accessKeyId: 'AKIA6GVYV6WLQKFPXVTK',
     secretAccessKey: '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',
     usersTable: 'metro-users',
     projectsTable: 'metro-projects',
     s3Bucket: 'metrosp2025maua'
   };
   ```

---

## 🔒 SEGURANÇA

### ⚠️ IMPORTANTE - PROTEÇÃO DAS CREDENCIAIS
- ✅ O arquivo `credentials.js` está no `.gitignore` 
- ✅ Suas credenciais NÃO serão enviadas para o Git
- ✅ Apenas o arquivo `credentials.example.js` é versionado

### 🛡️ VERIFICAÇÃO DE SEGURANÇA
Execute no terminal para verificar:
```bash
cd Mobile
git status
# credentials.js NÃO deve aparecer na lista
```

---

## 🧪 COMO TESTAR

### 1. **Verificar se as credenciais estão funcionando**
   - Execute o app: `npx expo start`
   - Observe os logs no terminal
   - Deve aparecer: `🔧 AWS Config Mobile: {hasAccessKey: true, hasSecretKey: true}`

### 2. **Testar o login**
   - Use as credenciais de usuários já cadastrados no sistema web
   - Usuário: `admin` / Senha: `admin123`
   - Se der erro de credenciais AWS inválidas, verifique o arquivo `credentials.js`

---

## 🔧 ONDE OBTER AS CREDENCIAIS AWS

### 📋 VOCÊ PRECISA DE:
1. **AWS Access Key ID** - Exemplo: `AKIA6GVYV6WLQKFPXVTK`
2. **AWS Secret Access Key** - Exemplo: `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`

### 🌐 COMO OBTER:
1. **Console AWS** → IAM → Users → Seu usuário → Security credentials
2. **Ou** peça para o administrador do projeto AWS
3. **Ou** use as mesmas credenciais do sistema web

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

### ❌ Erro: "The security token included in the request is invalid"
**Solução:** Credenciais incorretas ou expiradas
- Verifique se copiou corretamente as credenciais
- Confirme se as credenciais têm permissão para DynamoDB
- Teste as credenciais no sistema web primeiro

### ❌ Erro: "Cannot resolve module './credentials'"
**Solução:** Arquivo de credenciais não existe
- Certifique-se que `Mobile/config/credentials.js` existe
- Copie `credentials.example.js` como `credentials.js`

### ❌ Erro: "Usuário não encontrado"
**Solução:** Usuário não existe no DynamoDB
- Use credenciais de usuários já cadastrados no sistema web
- Cadastre o usuário primeiro no sistema web

---

## 📚 ARQUIVOS DO SISTEMA

### 🔧 `config/credentials.js` (SEU ARQUIVO)
- **Função:** Contém suas credenciais AWS reais
- **Editar:** ✅ SIM - coloque suas credenciais aqui
- **Git:** ❌ NÃO é versionado (protegido)

### 📋 `config/credentials.example.js` (EXEMPLO)
- **Função:** Modelo/exemplo de como configurar
- **Editar:** ❌ NÃO - apenas para referência
- **Git:** ✅ SIM - é versionado

### ⚙️ `config/aws-config.js` (SISTEMA)
- **Função:** Configuração técnica do AWS SDK
- **Editar:** ❌ NÃO - funciona automaticamente
- **Git:** ✅ SIM - é versionado

---

## ✅ CHECKLIST FINAL

- [ ] Arquivo `Mobile/config/credentials.js` criado
- [ ] Access Key ID colocado corretamente
- [ ] Secret Access Key colocado corretamente
- [ ] App inicia sem erros de credenciais
- [ ] Login funciona com usuários do sistema web
- [ ] Arquivo `credentials.js` não aparece no `git status`

**🎉 Pronto! Seu sistema está conectado exclusivamente com AWS DynamoDB!**

