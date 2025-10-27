import { s3, S3_BUCKET } from '../config/aws-config';

/**
 * Serviço para gerenciar documentos da obra no S3
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
        Bucket: S3_BUCKET,
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
            url: this.getFileUrl(item.Key)
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
   * @param {File} file - Arquivo para upload
   * @param {Function} onProgress - Callback para progresso (opcional)
   * @returns {Promise<Object>} Resultado do upload
   */
  async uploadDocument(projectName, path, file, onProgress = null) {
    try {
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      const sanitizedFileName = this.sanitizeFileName(file.name);
      const s3Key = `${sanitizedProjectName}/documentos/${path}${sanitizedFileName}`;

      // Verificar se arquivo já existe
      const exists = await this.fileExists(s3Key);
      if (exists) {
        return {
          success: false,
          message: 'Já existe um arquivo com este nome nesta pasta'
        };
      }

      const uploadParams = {
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'original-name': file.name,
          'upload-date': new Date().toISOString(),
          'file-size': file.size.toString()
        }
      };

      // Upload com progresso se callback fornecido
      if (onProgress) {
        const upload = s3.upload(uploadParams);
        upload.on('httpUploadProgress', (progress) => {
          const percentage = Math.round((progress.loaded / progress.total) * 100);
          onProgress(percentage);
        });
        
        const result = await upload.promise();
        
        return {
          success: true,
          message: 'Arquivo enviado com sucesso',
          file: {
            name: sanitizedFileName,
            key: s3Key,
            url: result.Location,
            size: file.size
          }
        };
      } else {
        const result = await s3.upload(uploadParams).promise();
        
        return {
          success: true,
          message: 'Arquivo enviado com sucesso',
          file: {
            name: sanitizedFileName,
            key: s3Key,
            url: result.Location,
            size: file.size
          }
        };
      }

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
   * @param {string} parentPath - Caminho da pasta pai
   * @param {string} folderName - Nome da nova pasta
   * @returns {Promise<Object>} Resultado da operação
   */
  async createFolder(projectName, parentPath, folderName) {
    try {
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      const sanitizedFolderName = this.sanitizeFolderName(folderName);
      
      // Verificar se pasta já existe
      const folderPath = `${parentPath}${sanitizedFolderName}/`;
      const exists = await this.folderExists(projectName, folderPath);
      
      if (exists) {
        return {
          success: false,
          message: 'Já existe uma pasta com este nome'
        };
      }

      // Criar marcador de pasta (arquivo vazio)
      const s3Key = `${sanitizedProjectName}/documentos/${folderPath}.foldermarker`;
      
      const params = {
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: '',
        ContentType: 'application/x-empty',
        Metadata: {
          'folder-name': sanitizedFolderName,
          'created-date': new Date().toISOString()
        }
      };

      await s3.upload(params).promise();

      return {
        success: true,
        message: 'Pasta criada com sucesso',
        folder: {
          name: sanitizedFolderName,
          path: folderPath
        }
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
   * Deletar arquivo ou pasta
   * @param {string} projectName - Nome do projeto
   * @param {string} itemPath - Caminho do item a ser deletado
   * @param {string} type - Tipo do item ('file' ou 'folder')
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteItem(projectName, itemPath, type) {
    try {
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      
      if (type === 'file') {
        // Deletar arquivo único
        const s3Key = `${sanitizedProjectName}/documentos/${itemPath}`;
        
        await s3.deleteObject({
          Bucket: S3_BUCKET,
          Key: s3Key
        }).promise();

        return {
          success: true,
          message: 'Arquivo deletado com sucesso'
        };

      } else if (type === 'folder') {
        // Deletar pasta e todo seu conteúdo
        const prefix = `${sanitizedProjectName}/documentos/${itemPath}`;
        
        // Listar todos os objetos na pasta
        const listParams = {
          Bucket: S3_BUCKET,
          Prefix: prefix
        };

        const objects = await s3.listObjectsV2(listParams).promise();
        
        if (objects.Contents && objects.Contents.length > 0) {
          // Deletar todos os objetos
          const deleteParams = {
            Bucket: S3_BUCKET,
            Delete: {
              Objects: objects.Contents.map(obj => ({ Key: obj.Key }))
            }
          };

          await s3.deleteObjects(deleteParams).promise();
        }

        return {
          success: true,
          message: 'Pasta deletada com sucesso'
        };
      }

    } catch (error) {
      console.error('Erro ao deletar item:', error);
      return {
        success: false,
        message: error.message || 'Erro ao deletar item'
      };
    }
  }

  /**
   * Gerar URL de download para um arquivo
   * @param {string} s3Key - Chave do arquivo no S3
   * @param {number} expiresIn - Tempo de expiração em segundos (padrão: 1 hora)
   * @returns {Promise<string>} URL de download
   */
  async getDownloadUrl(s3Key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: S3_BUCKET,
        Key: s3Key,
        Expires: expiresIn
      };

      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('Erro ao gerar URL de download:', error);
      throw error;
    }
  }

  /**
   * Verificar se um arquivo existe
   * @param {string} s3Key - Chave do arquivo no S3
   * @returns {Promise<boolean>} True se existe
   */
  async fileExists(s3Key) {
    try {
      await s3.headObject({
        Bucket: S3_BUCKET,
        Key: s3Key
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
   * Verificar se uma pasta existe
   * @param {string} projectName - Nome do projeto
   * @param {string} folderPath - Caminho da pasta
   * @returns {Promise<boolean>} True se existe
   */
  async folderExists(projectName, folderPath) {
    try {
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      const prefix = `${sanitizedProjectName}/documentos/${folderPath}`;
      
      const params = {
        Bucket: S3_BUCKET,
        Prefix: prefix,
        MaxKeys: 1
      };

      const result = await s3.listObjectsV2(params).promise();
      return result.Contents && result.Contents.length > 0;
    } catch (error) {
      return false;
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
    parts.forEach(part => {
      currentPath += part + '/';
      breadcrumb.push({
        name: part,
        path: currentPath
      });
    });

    return breadcrumb;
  }

  /**
   * Obter URL pública do arquivo
   * @param {string} s3Key - Chave do arquivo no S3
   * @returns {string} URL pública
   */
  getFileUrl(s3Key) {
    const region = process.env.REACT_APP_AWS_REGION || 'sa-east-1';
    return `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${s3Key}`;
  }

  /**
   * Sanitizar nome do projeto
   * @param {string} projectName - Nome do projeto
   * @returns {string} Nome sanitizado
   */
  sanitizeProjectName(projectName) {
    return projectName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  /**
   * Sanitizar nome do arquivo
   * @param {string} fileName - Nome do arquivo
   * @returns {string} Nome sanitizado
   */
  sanitizeFileName(fileName) {
    const parts = fileName.split('.');
    const extension = parts.pop();
    const name = parts.join('.');
    
    const sanitizedName = name
      .replace(/[^a-zA-Z0-9\-_\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
    
    return `${sanitizedName}.${extension}`;
  }

  /**
   * Sanitizar nome da pasta
   * @param {string} folderName - Nome da pasta
   * @returns {string} Nome sanitizado
   */
  sanitizeFolderName(folderName) {
    return folderName
      .replace(/[^a-zA-Z0-9\-_\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
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
      'ppt': '📊',
      'pptx': '📊',
      
      // Imagens
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'bmp': '🖼️',
      'svg': '🖼️',
      
      // CAD/Desenhos
      'dwg': '📐',
      'dxf': '📐',
      'dwf': '📐',
      
      // Compactados
      'zip': '🗜️',
      'rar': '🗜️',
      '7z': '🗜️',
      
      // Vídeos
      'mp4': '🎥',
      'avi': '🎥',
      'mov': '🎥',
      'wmv': '🎥'
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

const documentServiceInstance = new DocumentService();
export default documentServiceInstance;
