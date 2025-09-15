import AWS from 'aws-sdk';

// Configuração do AWS SDK
AWS.config.update({
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
});

// Criar instância do DynamoDB
export const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Nome da tabela (pode ser configurado via variável de ambiente)
export const USERS_TABLE = process.env.REACT_APP_USERS_TABLE || 'metro-users';
