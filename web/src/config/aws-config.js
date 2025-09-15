import AWS from 'aws-sdk';

// Verificar se as credenciais estão disponíveis
const AWS_REGION = process.env.REACT_APP_AWS_REGION || 'sa-east-1';
const AWS_ACCESS_KEY_ID = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('⚠️ ERRO: Credenciais AWS não encontradas!');
  console.error('Verifique se o arquivo .env está configurado corretamente.');
  console.error('Variáveis necessárias:');
  console.error('- REACT_APP_AWS_ACCESS_KEY_ID');
  console.error('- REACT_APP_AWS_SECRET_ACCESS_KEY');
  console.error('- REACT_APP_AWS_REGION (opcional)');
}

// Configuração do AWS SDK
AWS.config.update({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

// Criar instância do DynamoDB
export const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Nome da tabela (pode ser configurado via variável de ambiente)
export const USERS_TABLE = process.env.REACT_APP_USERS_TABLE || 'metro-users';

// Log para debug (remover em produção)
console.log('🔧 AWS Config:', {
  region: AWS_REGION,
  hasAccessKey: !!AWS_ACCESS_KEY_ID,
  hasSecretKey: !!AWS_SECRET_ACCESS_KEY,
  tableName: USERS_TABLE
});
