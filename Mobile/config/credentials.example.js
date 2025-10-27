/**
 * ARQUIVO DE EXEMPLO PARA CREDENCIAIS AWS
 * 
 * INSTRUÇÕES:
 * 1. Copie este arquivo como 'credentials.js' na mesma pasta
 * 2. Substitua as credenciais pelas suas credenciais AWS reais
 * 3. NÃO commite o arquivo credentials.js no git
 */

export const AWS_CREDENTIALS = {
  // Região AWS (São Paulo)
  region: 'sa-east-1',
  
  // SUBSTITUA PELAS SUAS CREDENCIAIS AWS REAIS
  accessKeyId: 'AKIA_SUA_ACCESS_KEY_AQUI',
  secretAccessKey: 'sua_secret_access_key_aqui',
  
  // Nomes das tabelas DynamoDB (não alterar)
  usersTable: 'metro-users',
  projectsTable: 'metro-projects',
  
  // Bucket S3 (não alterar)
  s3Bucket: 'metrosp2025maua'
};


