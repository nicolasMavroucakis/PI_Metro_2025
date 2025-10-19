import AWS from 'aws-sdk';
import { AWS_CREDENTIALS } from './credentials';

/**
 * Configuração AWS para o aplicativo mobile Metro SP
 * 
 * IMPORTANTE: As credenciais estão no arquivo './credentials.js'
 * Para alterar as credenciais, edite o arquivo 'config/credentials.js'
 */

// Configuração do AWS SDK usando as credenciais importadas
AWS.config.update({
  region: AWS_CREDENTIALS.region,
  accessKeyId: AWS_CREDENTIALS.accessKeyId,
  secretAccessKey: AWS_CREDENTIALS.secretAccessKey,
});

// Criar instância do DynamoDB
export const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Criar instância do S3
export const s3 = new AWS.S3();

// Exportar configurações das tabelas e bucket
export const USERS_TABLE = AWS_CREDENTIALS.usersTable;
export const PROJECTS_TABLE = AWS_CREDENTIALS.projectsTable;
export const S3_BUCKET = AWS_CREDENTIALS.s3Bucket;

// Log para debug (mostra se as credenciais estão configuradas)
console.log('🔧 AWS Config Mobile:', {
  region: AWS_CREDENTIALS.region,
  hasAccessKey: !!AWS_CREDENTIALS.accessKeyId,
  hasSecretKey: !!AWS_CREDENTIALS.secretAccessKey,
  usersTable: USERS_TABLE,
  projectsTable: PROJECTS_TABLE,
  s3Bucket: S3_BUCKET
});
