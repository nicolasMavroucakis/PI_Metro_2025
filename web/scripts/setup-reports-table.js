/**
 * Script para criar a tabela metro-bim-reports no DynamoDB
 * 
 * Execute: node scripts/setup-reports-table.js
 */

require('dotenv').config();
const AWS = require('aws-sdk');

// Configurar AWS
AWS.config.update({
  region: process.env.REACT_APP_AWS_REGION || 'sa-east-1',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();
const TABLE_NAME = process.env.REACT_APP_REPORTS_TABLE || 'metro-bim-reports';

const tableParams = {
  TableName: TABLE_NAME,
  KeySchema: [
    { AttributeName: 'reportId', KeyType: 'HASH' },  // Partition key
    { AttributeName: 'projectId', KeyType: 'RANGE' }  // Sort key
  ],
  AttributeDefinitions: [
    { AttributeName: 'reportId', AttributeType: 'S' },
    { AttributeName: 'projectId', AttributeType: 'S' },
    { AttributeName: 'GSI1_PK', AttributeType: 'S' },
    { AttributeName: 'GSI1_SK', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        { AttributeName: 'GSI1_PK', KeyType: 'HASH' },
        { AttributeName: 'GSI1_SK', KeyType: 'RANGE' }
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
  },
  Tags: [
    {
      Key: 'Project',
      Value: 'PI-Metro-2025'
    },
    {
      Key: 'Purpose',
      Value: 'BIM-Reports-Storage'
    }
  ]
};

async function createTable() {
  try {
    console.log(`\n🔧 Criando tabela ${TABLE_NAME}...`);
    
    // Verificar se a tabela já existe
    try {
      await dynamodb.describeTable({ TableName: TABLE_NAME }).promise();
      console.log(`⚠️  Tabela ${TABLE_NAME} já existe!`);
      console.log(`\nSe você quiser recriá-la, delete primeiro com:`);
      console.log(`   aws dynamodb delete-table --table-name ${TABLE_NAME}`);
      return;
    } catch (error) {
      if (error.code !== 'ResourceNotFoundException') {
        throw error;
      }
      // Tabela não existe, podemos criar
    }
    
    // Criar tabela
    const result = await dynamodb.createTable(tableParams).promise();
    
    console.log(`✅ Tabela criada com sucesso!`);
    console.log(`\nDetalhes da tabela:`);
    console.log(`   Nome: ${result.TableDescription.TableName}`);
    console.log(`   Status: ${result.TableDescription.TableStatus}`);
    console.log(`   ARN: ${result.TableDescription.TableArn}`);
    
    console.log(`\nAguardando tabela ficar ativa...`);
    await dynamodb.waitFor('tableExists', { TableName: TABLE_NAME }).promise();
    
    console.log(`\n✅ Tabela ${TABLE_NAME} está ativa e pronta para uso!`);
    
    console.log(`\nEstrutura da tabela:`);
    console.log(`   Primary Key:`);
    console.log(`      - reportId (HASH)`);
    console.log(`      - projectId (RANGE)`);
    console.log(`   Global Secondary Index (GSI1):`);
    console.log(`      - GSI1_PK (HASH) - Formato: "project#<projectId>"`);
    console.log(`      - GSI1_SK (RANGE) - Timestamp ISO`);
    
    console.log(`\nCapacidade provisionada:`);
    console.log(`   Read: 5 unidades`);
    console.log(`   Write: 5 unidades`);
    
    console.log(`\n💡 Dica: Adicione esta variável no seu .env:`);
    console.log(`   REACT_APP_REPORTS_TABLE=${TABLE_NAME}`);
    
  } catch (error) {
    console.error(`\n❌ Erro ao criar tabela:`, error.message);
    
    if (error.code === 'UnrecognizedClientException') {
      console.error(`\n⚠️  Credenciais AWS inválidas!`);
      console.error(`Verifique:`);
      console.error(`   - REACT_APP_AWS_ACCESS_KEY_ID`);
      console.error(`   - REACT_APP_AWS_SECRET_ACCESS_KEY`);
      console.error(`   - REACT_APP_AWS_REGION`);
    } else if (error.code === 'AccessDeniedException') {
      console.error(`\n⚠️  Sem permissão para criar tabelas!`);
      console.error(`Verifique se suas credenciais AWS têm permissão DynamoDB:CreateTable`);
    }
    
    process.exit(1);
  }
}

// Função para deletar tabela (útil para testes)
async function deleteTable() {
  try {
    console.log(`\n🗑️  Deletando tabela ${TABLE_NAME}...`);
    
    await dynamodb.deleteTable({ TableName: TABLE_NAME }).promise();
    
    console.log(`✅ Tabela ${TABLE_NAME} deletada com sucesso!`);
    
    console.log(`\nAguardando confirmação...`);
    await dynamodb.waitFor('tableNotExists', { TableName: TABLE_NAME }).promise();
    
    console.log(`✅ Tabela completamente removida!`);
    
  } catch (error) {
    if (error.code === 'ResourceNotFoundException') {
      console.log(`⚠️  Tabela ${TABLE_NAME} não existe.`);
    } else {
      console.error(`\n❌ Erro ao deletar tabela:`, error.message);
      process.exit(1);
    }
  }
}

// Função para verificar status da tabela
async function checkTable() {
  try {
    console.log(`\n🔍 Verificando tabela ${TABLE_NAME}...`);
    
    const result = await dynamodb.describeTable({ TableName: TABLE_NAME }).promise();
    
    console.log(`\n✅ Tabela encontrada!`);
    console.log(`   Nome: ${result.Table.TableName}`);
    console.log(`   Status: ${result.Table.TableStatus}`);
    console.log(`   ARN: ${result.Table.TableArn}`);
    console.log(`   Criada em: ${new Date(result.Table.CreationDateTime).toLocaleString('pt-BR')}`);
    console.log(`   Items: ${result.Table.ItemCount}`);
    console.log(`   Tamanho: ${(result.Table.TableSizeBytes / 1024).toFixed(2)} KB`);
    
    console.log(`\n   Primary Key:`);
    result.Table.KeySchema.forEach(key => {
      console.log(`      - ${key.AttributeName} (${key.KeyType === 'HASH' ? 'Partition' : 'Sort'} Key)`);
    });
    
    if (result.Table.GlobalSecondaryIndexes && result.Table.GlobalSecondaryIndexes.length > 0) {
      console.log(`\n   Global Secondary Indexes:`);
      result.Table.GlobalSecondaryIndexes.forEach(gsi => {
        console.log(`      ${gsi.IndexName}:`);
        gsi.KeySchema.forEach(key => {
          console.log(`         - ${key.AttributeName} (${key.KeyType === 'HASH' ? 'Partition' : 'Sort'} Key)`);
        });
      });
    }
    
    console.log(`\n   Capacidade:`);
    console.log(`      Read: ${result.Table.ProvisionedThroughput.ReadCapacityUnits} unidades`);
    console.log(`      Write: ${result.Table.ProvisionedThroughput.WriteCapacityUnits} unidades`);
    
  } catch (error) {
    if (error.code === 'ResourceNotFoundException') {
      console.log(`\n❌ Tabela ${TABLE_NAME} não existe!`);
      console.log(`\nCrie a tabela executando:`);
      console.log(`   node scripts/setup-reports-table.js create`);
    } else {
      console.error(`\n❌ Erro ao verificar tabela:`, error.message);
      process.exit(1);
    }
  }
}

// Main
const command = process.argv[2] || 'create';

console.log(`\n========================================`);
console.log(`   Setup da Tabela de Relatórios BIM`);
console.log(`========================================`);

switch (command) {
  case 'create':
    createTable();
    break;
  case 'delete':
    deleteTable();
    break;
  case 'check':
  case 'status':
    checkTable();
    break;
  case 'recreate':
    (async () => {
      await deleteTable();
      console.log(`\nAguardando 5 segundos...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      await createTable();
    })();
    break;
  default:
    console.log(`\nComandos disponíveis:`);
    console.log(`   create   - Criar tabela (padrão)`);
    console.log(`   delete   - Deletar tabela`);
    console.log(`   check    - Verificar status da tabela`);
    console.log(`   recreate - Deletar e recriar tabela`);
    console.log(`\nExemplo:`);
    console.log(`   node scripts/setup-reports-table.js create`);
}

