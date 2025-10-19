import AWS from 'aws-sdk';
import { AWS_CREDENTIALS } from '../config/credentials';

// Configurar AWS
AWS.config.update({
  accessKeyId: AWS_CREDENTIALS.accessKeyId,
  secretAccessKey: AWS_CREDENTIALS.secretAccessKey,
  region: AWS_CREDENTIALS.region
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

/**
 * Serviço para operações de projeto no mobile
 */
class ProjectService {
  /**
   * Listar todos os projetos
   * @returns {Promise<Array>} Lista de projetos
   */
  async getAllProjects() {
    try {
      const params = {
        TableName: AWS_CREDENTIALS.projectsTable,
        FilterExpression: 'isActive = :isActive',
        ExpressionAttributeValues: {
          ':isActive': true
        }
      };

      const result = await dynamoDB.scan(params).promise();
      return {
        success: true,
        projects: result.Items || []
      };

    } catch (error) {
      console.error('Erro ao listar projetos:', error);
      return {
        success: false,
        message: 'Erro ao carregar projetos',
        projects: []
      };
    }
  }

  /**
   * Buscar projeto por ID
   * @param {string} projectId - ID do projeto
   * @returns {Promise<Object|null>} Dados do projeto ou null
   */
  async getProjectById(projectId) {
    try {
      const params = {
        TableName: AWS_CREDENTIALS.projectsTable,
        Key: { projectId }
      };

      const result = await dynamoDB.get(params).promise();
      
      if (result.Item) {
        return {
          success: true,
          project: result.Item
        };
      }
      
      return {
        success: false,
        message: 'Projeto não encontrado'
      };

    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      return {
        success: false,
        message: 'Erro ao carregar projeto'
      };
    }
  }

  /**
   * Listar fotos de obra de um projeto (categoria1 - Fotos da Obra)
   * @param {string} projectName - Nome do projeto
   * @returns {Promise<Object>} Lista de fotos
   */
  async getProjectPhotos(projectName) {
    try {
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      // Usar o mesmo caminho que o web: fotos/categoria1/
      const prefix = `${sanitizedProjectName}/fotos/categoria1/`;
      
      const params = {
        Bucket: AWS_CREDENTIALS.s3Bucket,
        Prefix: prefix
      };

      const result = await s3.listObjectsV2(params).promise();
      
      const photos = (result.Contents || [])
        .filter(item => !item.Key.endsWith('/')) // Remover marcadores de pasta
        .filter(item => this.isImageFile(item.Key)) // Apenas arquivos de imagem
        .map(item => {
          const fileName = item.Key.split('/').pop();
          return {
            key: item.Key,
            name: fileName,
            size: item.Size,
            lastModified: item.LastModified,
            url: this.getSignedUrl(item.Key)
          };
        })
        .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)); // Mais recentes primeiro

      return {
        success: true,
        photos
      };

    } catch (error) {
      console.error('Erro ao listar fotos:', error);
      return {
        success: false,
        message: 'Erro ao carregar fotos',
        photos: []
      };
    }
  }

  /**
   * Upload de foto de obra (categoria1 - Fotos da Obra)
   * @param {string} projectName - Nome do projeto
   * @param {string} imageUri - URI da imagem local
   * @param {Function} onProgress - Callback de progresso (opcional)
   * @returns {Promise<Object>} Resultado do upload
   */
  async uploadPhoto(projectName, imageUri, onProgress = null) {
    try {
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      
      // Gerar nome único para o arquivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `foto-obra-${timestamp}.jpg`;
      // Usar o mesmo caminho que o web: fotos/categoria1/
      const key = `${sanitizedProjectName}/fotos/categoria1/${fileName}`;

      // Converter URI para blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Parâmetros do upload
      const uploadParams = {
        Bucket: AWS_CREDENTIALS.s3Bucket,
        Key: key,
        Body: blob,
        ContentType: 'image/jpeg',
        Metadata: {
          'uploaded-by': 'mobile-app',
          'upload-date': new Date().toISOString(),
          'project-name': projectName,
          'category': 'categoria1'
        }
      };

      // Realizar upload
      const upload = s3.upload(uploadParams);
      
      // Monitorar progresso se callback fornecido
      if (onProgress) {
        upload.on('httpUploadProgress', (progress) => {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          onProgress(percentage);
        });
      }

      const result = await upload.promise();

      return {
        success: true,
        message: 'Foto da obra enviada com sucesso!',
        url: result.Location,
        key: result.Key
      };

    } catch (error) {
      console.error('Erro no upload da foto:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar foto'
      };
    }
  }

  /**
   * Deletar foto de obra
   * @param {string} photoKey - Chave da foto no S3
   * @returns {Promise<Object>} Resultado da operação
   */
  async deletePhoto(photoKey) {
    try {
      const params = {
        Bucket: AWS_CREDENTIALS.s3Bucket,
        Key: photoKey
      };

      await s3.deleteObject(params).promise();

      return {
        success: true,
        message: 'Foto removida com sucesso!'
      };

    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      return {
        success: false,
        message: 'Erro ao remover foto'
      };
    }
  }

  /**
   * Gerar URL assinada para visualização de imagem
   * @param {string} key - Chave do arquivo no S3
   * @returns {string} URL assinada
   */
  getSignedUrl(key) {
    try {
      return s3.getSignedUrl('getObject', {
        Bucket: AWS_CREDENTIALS.s3Bucket,
        Key: key,
        Expires: 3600 // 1 hora
      });
    } catch (error) {
      console.error('Erro ao gerar URL assinada:', error);
      return null;
    }
  }

  /**
   * Sanitizar nome do projeto para uso como chave S3
   * @param {string} projectName - Nome do projeto
   * @returns {string} Nome sanitizado
   */
  sanitizeProjectName(projectName) {
    return projectName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Verificar se o arquivo é uma imagem
   * @param {string} key - Chave do arquivo
   * @returns {boolean} True se for imagem
   */
  isImageFile(key) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const extension = key.toLowerCase().substring(key.lastIndexOf('.'));
    return imageExtensions.includes(extension);
  }
}

export default new ProjectService();
