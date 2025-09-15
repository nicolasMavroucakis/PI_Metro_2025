/**
 * Script para configurar a tabela de usuários no DynamoDB
 * Execute este script uma vez para criar a estrutura necessária
 */

const AWS = require('aws-sdk');

// Configurar AWS (certifique-se de ter as credenciais configuradas)
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB();

const TABLE_NAME = process.env.USERS_TABLE || 'metro-users';

const createUsersTable = async () => {
  const params = {
    TableName: TABLE_NAME,
    KeySchema: [
      {
        AttributeName: 'username',
        KeyType: 'HASH' // Partition key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'username',
        AttributeType: 'S'
      },
      {
        AttributeName: 'email',
        AttributeType: 'S'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'EmailIndex',
        KeySchema: [
          {
            AttributeName: 'email',
            KeyType: 'HASH'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    console.log(`Criando tabela ${TABLE_NAME}...`);
    const result = await dynamodb.createTable(params).promise();
    console.log('Tabela criada com sucesso!');
    console.log('Aguarde alguns minutos para a tabela ficar ativa...');
    
    // Aguardar a tabela ficar ativa
    await dynamodb.waitFor('tableExists', { TableName: TABLE_NAME }).promise();
    console.log('Tabela está ativa e pronta para uso!');
    
    return result;
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('Tabela já existe!');
    } else {
      console.error('Erro ao criar tabela:', error);
      throw error;
    }
  }
};

const describeTable = async () => {
  try {
    const result = await dynamodb.describeTable({ TableName: TABLE_NAME }).promise();
    console.log('\nInformações da tabela:');
    console.log('Nome:', result.Table.TableName);
    console.log('Status:', result.Table.TableStatus);
    console.log('Itens:', result.Table.ItemCount);
    console.log('Criada em:', result.Table.CreationDateTime);
  } catch (error) {
    console.error('Erro ao descrever tabela:', error.message);
  }
};

// Executar setup
const main = async () => {
  try {
    console.log('=== Setup DynamoDB para Metro SP ===\n');
    
    // Verificar se as credenciais estão configuradas
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('ERRO: Credenciais AWS não encontradas!');
      console.log('Configure as seguintes variáveis de ambiente:');
      console.log('- AWS_ACCESS_KEY_ID');
      console.log('- AWS_SECRET_ACCESS_KEY');
      console.log('- AWS_REGION (opcional, padrão: us-east-1)');
      process.exit(1);
    }
    
    await createUsersTable();
    await describeTable();
    
    console.log('\n=== Setup concluído com sucesso! ===');
    console.log('Agora você pode usar o sistema de login/registro.');
    
  } catch (error) {
    console.error('Erro no setup:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { createUsersTable, describeTable };
