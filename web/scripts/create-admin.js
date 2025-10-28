/**
 * Script para criar um usuário administrador no DynamoDB
 * 
 * Execute: node scripts/create-admin.js
 */

require('dotenv').config();
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Configurar AWS
AWS.config.update({
  region: process.env.REACT_APP_AWS_REGION || 'sa-east-1',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.REACT_APP_USERS_TABLE || 'metro-users';

// Interface para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
  console.log('\n========================================');
  console.log('   Criar Usuário Administrador - WEB');
  console.log('========================================\n');

  try {
    // Solicitar dados do usuário
    const username = await question('Username (admin): ') || 'admin';
    const password = await question('Senha (mínimo 6 caracteres): ');
    const email = await question('Email: ');
    const name = await question('Nome completo (opcional): ') || '';

    // Validações
    if (!password || password.length < 6) {
      console.error('\n❌ Senha deve ter no mínimo 6 caracteres!');
      rl.close();
      process.exit(1);
    }

    if (!email) {
      console.error('\n❌ Email é obrigatório!');
      rl.close();
      process.exit(1);
    }

    // Verificar se usuário já existe
    console.log(`\n🔍 Verificando se usuário "${username}" já existe...`);
    
    const existing = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { username }
    }).promise();

    if (existing.Item) {
      console.log(`\n⚠️  Usuário "${username}" já existe!`);
      const update = await question('Deseja atualizar para admin? (s/n): ');
      
      if (update.toLowerCase() === 's' || update.toLowerCase() === 'sim') {
        // Atualizar usuário existente
        await dynamodb.update({
          TableName: USERS_TABLE,
          Key: { username },
          UpdateExpression: 'SET isAdmin = :isAdmin, #role = :role, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#role': 'role'
          },
          ExpressionAttributeValues: {
            ':isAdmin': true,
            ':role': 'admin',
            ':updatedAt': new Date().toISOString()
          }
        }).promise();
        
        console.log(`\n✅ Usuário "${username}" atualizado para administrador!`);
        console.log('\n💡 Faça logout e login novamente no sistema web.');
        console.log('   O menu "Gerenciamento de Usuários" estará visível.\n');
      } else {
        console.log('\n❌ Operação cancelada.');
      }
      
      rl.close();
      return;
    }

    // Hash da senha
    console.log('\n🔐 Gerando hash da senha...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário admin
    const adminUser = {
      username,
      password: hashedPassword,
      email,
      name,
      role: 'admin',
      isAdmin: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null
    };

    console.log('\n💾 Criando usuário administrador...');
    
    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: adminUser
    }).promise();

    console.log('\n✅ Usuário administrador criado com sucesso!');
    console.log('\nDetalhes:');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Nome: ${name || 'N/A'}`);
    console.log(`   Função: admin`);
    console.log(`   Administrador: Sim`);
    console.log(`   Ativo: Sim`);
    
    console.log('\n💡 Você pode fazer login no sistema web com essas credenciais.');
    console.log('   O menu "Gerenciamento de Usuários" estará visível apenas para este usuário.\n');

  } catch (error) {
    console.error('\n❌ Erro ao criar usuário:', error.message);
    
    if (error.code === 'ResourceNotFoundException') {
      console.error('\n⚠️  Tabela "metro-users" não encontrada!');
      console.error('Execute o script de setup do DynamoDB primeiro:');
      console.error('   node scripts/setup-dynamodb.js');
    } else if (error.code === 'UnrecognizedClientException') {
      console.error('\n⚠️  Credenciais AWS inválidas!');
      console.error('Verifique o arquivo .env');
    }
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Executar
createAdminUser();


