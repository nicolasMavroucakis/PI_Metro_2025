/**
 * Script de teste para criar usuários de exemplo
 * Use apenas para desenvolvimento/testes
 */

const userService = require('../src/services/userService');

const testUsers = [
  {
    name: 'Administrador Sistema',
    username: 'admin',
    email: 'admin@metro.sp.gov.br',
    password: 'admin123'
  },
  {
    name: 'João Silva',
    username: 'joao.silva',
    email: 'joao.silva@metro.sp.gov.br',
    password: 'senha123'
  },
  {
    name: 'Maria Santos',
    username: 'maria.santos',
    email: 'maria.santos@metro.sp.gov.br',
    password: 'senha123'
  }
];

const createTestUsers = async () => {
  console.log('=== Criando usuários de teste ===\n');
  
  for (const userData of testUsers) {
    try {
      console.log(`Criando usuário: ${userData.username}`);
      const result = await userService.createUser(userData);
      
      if (result.success) {
        console.log(`✅ Usuário ${userData.username} criado com sucesso`);
      } else {
        console.log(`❌ Erro ao criar ${userData.username}: ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao criar ${userData.username}:`, error.message);
    }
    console.log('');
  }
};

const testAuthentication = async () => {
  console.log('=== Testando autenticação ===\n');
  
  for (const userData of testUsers) {
    try {
      console.log(`Testando login: ${userData.username}`);
      const result = await userService.authenticateUser(userData.username, userData.password);
      
      if (result.success) {
        console.log(`✅ Login ${userData.username} bem-sucedido`);
        console.log(`   Nome: ${result.user.name}`);
        console.log(`   Email: ${result.user.email}`);
      } else {
        console.log(`❌ Falha no login ${userData.username}: ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ Erro no login ${userData.username}:`, error.message);
    }
    console.log('');
  }
};

const main = async () => {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.REACT_APP_AWS_ACCESS_KEY_ID) {
      console.error('ERRO: Variáveis de ambiente não configuradas!');
      console.log('Crie um arquivo .env com as configurações necessárias.');
      process.exit(1);
    }
    
    await createTestUsers();
    await testAuthentication();
    
    console.log('=== Teste concluído ===');
    console.log('Agora você pode usar estes usuários para testar o sistema:');
    console.log('');
    testUsers.forEach(user => {
      console.log(`Username: ${user.username} | Senha: ${user.password}`);
    });
    
  } catch (error) {
    console.error('Erro no teste:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  // Carregar variáveis de ambiente do arquivo .env
  require('dotenv').config();
  main();
}

module.exports = { createTestUsers, testAuthentication };
