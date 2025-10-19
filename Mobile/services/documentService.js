import AWS from 'aws-sdk';
import { AWS_CREDENTIALS } from '../config/credentials';

// Configurar AWS
AWS.config.update({
  accessKeyId: AWS_CREDENTIALS.accessKeyId,
  secretAccessKey: AWS_CREDENTIALS.secretAccessKey,
  region: AWS_CREDENTIALS.region
});

const s3 = new AWS.S3();

/**
 * Serviço para gerenciar documentos da obra no mobile
 */
class DocumentService {
  /**
   * Listar conteúdo de uma pasta de documentos
   * @param {string} projectName - Nome do projeto
   * @param {string} path - Caminho da pasta (ex: 'contratos/2024/')
   * @returns {Promise<Object>} Objeto com pastas e arquivos
   */
  async listDocuments(projectName, path = '') {
    try {
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      const prefix = `${sanitizedProjectName}/documentos/${path}`;
      
      const params = {
        Bucket: AWS_CREDENTIALS.s3Bucket,
        Prefix: prefix,
        Delimiter: '/'
      };

      const result = await s3.listObjectsV2(params).promise();
      
      // Processar pastas (CommonPrefixes)
      const folders = (result.CommonPrefixes || []).map(item => {
        const fullPath = item.Prefix;
        const folderName = fullPath.replace(prefix, '').replace('/', '');
        return {
          name: folderName,
          type: 'folder',
          path: path + folderName + '/',
          fullPath: fullPath
        };
      });

      // Processar arquivos
      const files = (result.Contents || [])
        .filter(item => item.Key !== prefix) // Remover a própria pasta
        .filter(item => !item.Key.endsWith('/')) // Remover marcadores de pasta
        .map(item => {
          const fileName = item.Key.split('/').pop();
          const fileExtension = fileName.split('.').pop().toLowerCase();
          
          return {
            name: fileName,
            type: 'file',
            extension: fileExtension,
            size: item.Size,
            lastModified: item.LastModified,
            key: item.Key,
            url: this.getSignedUrl(item.Key)
          };
        });

      return {
        success: true,
        folders: folders.sort((a, b) => a.name.localeCompare(b.name)),
        files: files.sort((a, b) => a.name.localeCompare(b.name)),
        currentPath: path,
        breadcrumb: this.generateBreadcrumb(path)
      };

    } catch (error) {
      console.error('Erro ao listar documentos:', error);
      return {
        success: false,
        message: error.message,
        folders: [],
        files: [],
        currentPath: path,
        breadcrumb: []
      };
    }
  }

  /**
   * Upload de documento para uma pasta específica
   * @param {string} projectName - Nome do projeto
   * @param {string} path - Caminho da pasta de destino
   * @param {string} fileUri - URI do arquivo local
   * @param {string} fileName - Nome do arquivo
   * @param {string} mimeType - Tipo MIME do arquivo
   * @param {Function} onProgress - Callback para progresso (opcional)
   * @returns {Promise<Object>} Resultado do upload
   */
  async uploadDocument(projectName, path, fileUri, fileName, mimeType, onProgress = null) {
    try {
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const s3Key = `${sanitizedProjectName}/documentos/${path}${sanitizedFileName}`;

      // Verificar se arquivo já existe
      const exists = await this.fileExists(s3Key);
      if (exists) {
        return {
          success: false,
          message: 'Já existe um arquivo com este nome nesta pasta'
        };
      }

      // Converter URI para blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const uploadParams = {
        Bucket: AWS_CREDENTIALS.s3Bucket,
        Key: s3Key,
        Body: blob,
        ContentType: mimeType || 'application/octet-stream',
        Metadata: {
          'original-name': fileName,
          'upload-date': new Date().toISOString(),
          'uploaded-by': 'mobile-app',
          'file-size': blob.size.toString()
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
        message: 'Arquivo enviado com sucesso',
        file: {
          name: sanitizedFileName,
          key: s3Key,
          url: result.Location,
          size: blob.size
        }
      };

    } catch (error) {
      console.error('Erro no upload do documento:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar arquivo'
      };
    }
  }

  /**
   * Criar uma nova pasta
   * @param {string} projectName - Nome do projeto
   * @param {string} currentPath - Caminho atual
   * @param {string} folderName - Nome da nova pasta
   * @returns {Promise<Object>} Resultado da operação
   */
  async createFolder(projectName, currentPath, folderName) {
    try {
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      const sanitizedFolderName = this.sanitizeFileName(folderName);
      const folderKey = `${sanitizedProjectName}/documentos/${currentPath}${sanitizedFolderName}/`;

      // Verificar se pasta já existe
      const exists = await this.fileExists(folderKey);
      if (exists) {
        return {
          success: false,
          message: 'Já existe uma pasta com este nome'
        };
      }

      // Criar marcador de pasta (arquivo vazio)
      const params = {
        Bucket: AWS_CREDENTIALS.s3Bucket,
        Key: folderKey,
        Body: '',
        ContentType: 'application/x-directory',
        Metadata: {
          'created-date': new Date().toISOString(),
          'created-by': 'mobile-app'
        }
      };

      await s3.upload(params).promise();

      return {
        success: true,
        message: 'Pasta criada com sucesso'
      };

    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar pasta'
      };
    }
  }

  /**
   * Deletar um arquivo ou pasta
   * @param {string} key - Chave do item no S3
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteItem(key) {
    try {
      const params = {
        Bucket: AWS_CREDENTIALS.s3Bucket,
        Key: key
      };

      await s3.deleteObject(params).promise();

      return {
        success: true,
        message: 'Item removido com sucesso'
      };

    } catch (error) {
      console.error('Erro ao deletar item:', error);
      return {
        success: false,
        message: 'Erro ao remover item'
      };
    }
  }

  /**
   * Verificar se um arquivo existe
   * @param {string} key - Chave do arquivo
   * @returns {Promise<boolean>} True se existe
   */
  async fileExists(key) {
    try {
      await s3.headObject({
        Bucket: AWS_CREDENTIALS.s3Bucket,
        Key: key
      }).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Gerar URL assinada para download
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
   * Gerar breadcrumb para navegação
   * @param {string} path - Caminho atual
   * @returns {Array} Array de breadcrumbs
   */
  generateBreadcrumb(path) {
    if (!path || path === '') {
      return [{ name: 'Documentos', path: '' }];
    }

    const parts = path.split('/').filter(part => part !== '');
    const breadcrumb = [{ name: 'Documentos', path: '' }];
    
    let currentPath = '';
    for (const part of parts) {
      currentPath += part + '/';
      breadcrumb.push({
        name: part,
        path: currentPath
      });
    }
    
    return breadcrumb;
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
   * Sanitizar nome do arquivo
   * @param {string} fileName - Nome do arquivo
   * @returns {string} Nome sanitizado
   */
  sanitizeFileName(fileName) {
    return fileName
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/_+/g, '_');
  }

  /**
   * Obter ícone baseado na extensão do arquivo
   * @param {string} extension - Extensão do arquivo
   * @returns {string} Emoji do ícone
   */
  getFileIcon(extension) {
    const iconMap = {
      // Documentos
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'txt': '📄',
      'rtf': '📄',
      
      // Planilhas
      'xls': '📊',
      'xlsx': '📊',
      'csv': '📊',
      
      // Apresentações
      'ppt': '📽️',
      'pptx': '📽️',
      
      // Imagens
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'bmp': '🖼️',
      'svg': '🖼️',
      
      // Vídeos
      'mp4': '🎥',
      'avi': '🎥',
      'mov': '🎥',
      'wmv': '🎥',
      
      // Áudio
      'mp3': '🎵',
      'wav': '🎵',
      'flac': '🎵',
      
      // Arquivos compactados
      'zip': '📦',
      'rar': '📦',
      '7z': '📦',
      'tar': '📦',
      
      // CAD/Desenho
      'dwg': '📐',
      'dxf': '📐',
      'cad': '📐'
    };
    
    return iconMap[extension.toLowerCase()] || '📄';
  }

  /**
   * Formatar tamanho do arquivo
   * @param {number} bytes - Tamanho em bytes
   * @returns {string} Tamanho formatado
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new DocumentService();
