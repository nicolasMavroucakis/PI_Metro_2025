/**
 * Script para configurar a tabela de projetos no DynamoDB
 * Execute este script uma vez para criar a estrutura necessária
 */

const AWS = require('aws-sdk');

// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

// Configurar AWS
AWS.config.update({
  region: process.env.REACT_APP_AWS_REGION || process.env.AWS_REGION || 'sa-east-1',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB();

const PROJECTS_TABLE = process.env.REACT_APP_PROJECTS_TABLE || 'metro-projects';

const createProjectsTable = async () => {
  const params = {
    TableName: PROJECTS_TABLE,
    KeySchema: [
      {
        AttributeName: 'projectId',
        KeyType: 'HASH' // Partition key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'projectId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'projectName',
        AttributeType: 'S'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ProjectNameIndex',
        KeySchema: [
          {
            AttributeName: 'projectName',
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
    console.log(`Criando tabela ${PROJECTS_TABLE}...`);
    const result = await dynamodb.createTable(params).promise();
    console.log('Tabela de projetos criada com sucesso!');
    console.log('Aguarde alguns minutos para a tabela ficar ativa...');
    
    // Aguardar a tabela ficar ativa
    await dynamodb.waitFor('tableExists', { TableName: PROJECTS_TABLE }).promise();
    console.log('Tabela de projetos está ativa e pronta para uso!');
    
    return result;
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('Tabela de projetos já existe!');
    } else {
      console.error('Erro ao criar tabela de projetos:', error);
      throw error;
    }
  }
};

const describeProjectsTable = async () => {
  try {
    const result = await dynamodb.describeTable({ TableName: PROJECTS_TABLE }).promise();
    console.log('\nInformações da tabela de projetos:');
    console.log('Nome:', result.Table.TableName);
    console.log('Status:', result.Table.TableStatus);
    console.log('Itens:', result.Table.ItemCount);
    console.log('Criada em:', result.Table.CreationDateTime);
  } catch (error) {
    console.error('Erro ao descrever tabela de projetos:', error.message);
  }
};

// Executar setup
const main = async () => {
  try {
    console.log('=== Setup Tabela de Projetos DynamoDB ===\n');
    
    // Verificar se as credenciais estão configuradas
    const accessKey = process.env.REACT_APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    
    if (!accessKey || !secretKey) {
      console.error('ERRO: Credenciais AWS não encontradas!');
      console.log('Configure as seguintes variáveis de ambiente no arquivo .env:');
      console.log('- REACT_APP_AWS_ACCESS_KEY_ID');
      console.log('- REACT_APP_AWS_SECRET_ACCESS_KEY');
      console.log('- REACT_APP_AWS_REGION (opcional, padrão: sa-east-1)');
      process.exit(1);
    }
    
    await createProjectsTable();
    await describeProjectsTable();
    
    console.log('\n=== Setup da tabela de projetos concluído! ===');
    console.log('Agora você pode criar e gerenciar projetos.');
    
  } catch (error) {
    console.error('Erro no setup da tabela de projetos:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { createProjectsTable, describeProjectsTable };
