import { dynamoDB, PROJECTS_TABLE } from '../config/aws-config';
import { s3, S3_BUCKET } from '../config/aws-config';

/**
 * Serviço para operações de projeto no DynamoDB e S3
 */
class ProjectService {
  /**
   * Criar um novo projeto
   * @param {Object} projectData - Dados do projeto
   * @param {string} projectData.projectName - Nome do projeto
   * @param {string} projectData.startDate - Data de início
   * @param {string} projectData.endDate - Data de término
   * @param {string} projectData.status - Status do projeto
   * @param {File} projectData.projectImage - Arquivo de imagem (opcional)
   * @returns {Promise<Object>} Resultado da operação
   */
  async createProject(projectData) {
    try {
      const { projectName, startDate, endDate, status, projectImage } = projectData;
      
      // Verificar se o projeto já existe
      const existingProject = await this.getProjectByName(projectName);
      if (existingProject) {
        return {
          success: false,
          message: 'Já existe um projeto com este nome'
        };
      }

      // Gerar ID único para o projeto
      const projectId = this.generateProjectId(projectName);
      
      let imageUrl = null;
      
      // Upload da imagem se fornecida
      if (projectImage) {
        try {
          imageUrl = await this.uploadProjectImage(projectName, projectImage);
        } catch (imageError) {
          console.error('Erro no upload da imagem:', imageError);
          // Para desenvolvimento: continuar sem imagem se upload falhar
          console.warn('Continuando sem imagem devido ao erro de upload');
          imageUrl = null;
          // Descomente a linha abaixo para falhar completamente no erro de upload:
          // return { success: false, message: 'Erro ao fazer upload da imagem: ' + imageError.message };
        }
      }

      // Dados do projeto para inserir no DynamoDB
      const projectItem = {
        projectId: projectId,
        projectName: projectName,
        startDate: startDate,
        endDate: endDate,
        status: status,
        imageUrl: imageUrl,
        progress: 0, // Iniciar com 0% de progresso
        progressHistory: [], // Array para armazenar histórico de mudanças
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      // Inserir projeto no DynamoDB
      const params = {
        TableName: PROJECTS_TABLE,
        Item: projectItem,
        ConditionExpression: 'attribute_not_exists(projectId)'
      };

      await dynamoDB.put(params).promise();
      
      return {
        success: true,
        project: projectItem,
        message: 'Projeto criado com sucesso'
      };

    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      return {
        success: false,
        message: error.message || 'Erro interno do servidor'
      };
    }
  }

  /**
   * Upload de imagem do projeto para S3
   * @param {string} projectName - Nome do projeto
   * @param {File} imageFile - Arquivo de imagem
   * @returns {Promise<string>} URL da imagem no S3
   */
  async uploadProjectImage(projectName, imageFile) {
    try {
      // Sanitizar nome do projeto para usar como diretório
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      
      // Gerar nome único para a imagem
      const timestamp = Date.now();
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `foto-perfil-${timestamp}.${fileExtension}`;
      
      // Caminho no S3: projeto/fotoPerfil/arquivo.jpg
      const s3Key = `${sanitizedProjectName}/fotoPerfil/${fileName}`;
      
      // Tentar primeiro método: Upload direto
      try {
        const uploadParams = {
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: imageFile,
          ContentType: imageFile.type
        };

        const result = await s3.upload(uploadParams).promise();
        return result.Location;
        
      } catch (directUploadError) {
        console.log('Upload direto falhou, tentando URL pré-assinada...', directUploadError.message);
        
        // Método alternativo: URL pré-assinada
        const uploadParams = {
          Bucket: S3_BUCKET,
          Key: s3Key,
          ContentType: imageFile.type,
          Expires: 60 * 5 // 5 minutos
        };

        const signedUrl = await s3.getSignedUrlPromise('putObject', uploadParams);
        
        // Fazer upload usando fetch com a URL pré-assinada
        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          body: imageFile,
          headers: {
            'Content-Type': imageFile.type
          }
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Upload pré-assinado falhou: ${uploadResponse.status} ${uploadResponse.statusText}. ${errorText}`);
        }
        
        // Retornar URL pública da imagem
        const imageUrl = `https://${S3_BUCKET}.s3.${process.env.REACT_APP_AWS_REGION || 'sa-east-1'}.amazonaws.com/${s3Key}`;
        return imageUrl;
      }
      
    } catch (error) {
      console.error('Erro no upload S3:', error);
      throw new Error('Falha no upload da imagem: ' + error.message);
    }
  }

  /**
   * Buscar projeto por nome
   * @param {string} projectName - Nome do projeto
   * @returns {Promise<Object|null>} Dados do projeto ou null
   */
  async getProjectByName(projectName) {
    try {
      const params = {
        TableName: PROJECTS_TABLE,
        IndexName: 'ProjectNameIndex',
        KeyConditionExpression: 'projectName = :projectName',
        ExpressionAttributeValues: {
          ':projectName': projectName
        }
      };

      const result = await dynamoDB.query(params).promise();
      return result.Items && result.Items.length > 0 ? result.Items[0] : null;

    } catch (error) {
      console.error('Erro ao buscar projeto por nome:', error);
      // Fallback para scan se o índice não existir
      return await this.scanProjectByName(projectName);
    }
  }

  /**
   * Buscar projeto por nome usando scan (fallback)
   * @param {string} projectName - Nome do projeto
   * @returns {Promise<Object|null>} Dados do projeto ou null
   */
  async scanProjectByName(projectName) {
    try {
      const params = {
        TableName: PROJECTS_TABLE,
        FilterExpression: 'projectName = :projectName',
        ExpressionAttributeValues: {
          ':projectName': projectName
        }
      };

      const result = await dynamoDB.scan(params).promise();
      return result.Items && result.Items.length > 0 ? result.Items[0] : null;

    } catch (error) {
      console.error('Erro ao fazer scan por nome do projeto:', error);
      return null;
    }
  }

  /**
   * Listar todos os projetos
   * @returns {Promise<Array>} Lista de projetos
   */
  async getAllProjects() {
    try {
      const params = {
        TableName: PROJECTS_TABLE,
        FilterExpression: 'isActive = :isActive',
        ExpressionAttributeValues: {
          ':isActive': true
        }
      };

      const result = await dynamoDB.scan(params).promise();
      return result.Items || [];

    } catch (error) {
      console.error('Erro ao listar projetos:', error);
      return [];
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
        TableName: PROJECTS_TABLE,
        Key: {
          projectId: projectId
        }
      };

      const result = await dynamoDB.get(params).promise();
      return result.Item || null;

    } catch (error) {
      console.error('Erro ao buscar projeto por ID:', error);
      return null;
    }
  }

  /**
   * Gerar ID único para o projeto
   * @param {string} projectName - Nome do projeto
   * @returns {string} ID único
   */
  generateProjectId(projectName) {
    const timestamp = Date.now();
    const sanitized = projectName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${sanitized}-${timestamp}`;
  }

  /**
   * Sanitizar nome do projeto para usar como diretório no S3
   * @param {string} projectName - Nome do projeto
   * @returns {string} Nome sanitizado
   */
  sanitizeProjectName(projectName) {
    return projectName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50); // Limitar tamanho
  }

  /**
   * Atualizar projeto
   * @param {string} projectId - ID do projeto
   * @param {Object} updateData - Dados para atualizar
   * @returns {Promise<Object>} Resultado da operação
   */
  async updateProject(projectId, updateData) {
    try {
      const updateExpression = [];
      const expressionAttributeNames = {};
      const expressionAttributeValues = {};
      
      Object.keys(updateData).forEach(key => {
        if (key !== 'projectId') {
          updateExpression.push(`#${key} = :${key}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:${key}`] = updateData[key];
        }
      });
      
      // Sempre atualizar updatedAt
      updateExpression.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const params = {
        TableName: PROJECTS_TABLE,
        Key: { projectId: projectId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };

      const result = await dynamoDB.update(params).promise();
      
      return {
        success: true,
        project: result.Attributes,
        message: 'Projeto atualizado com sucesso'
      };

    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      return {
        success: false,
        message: error.message || 'Erro interno do servidor'
      };
    }
  }

  /**
   * Atualizar progresso do projeto e salvar no histórico
   * @param {string} projectId - ID do projeto
   * @param {number} newProgress - Novo progresso (0-100)
   * @param {string} observation - Observação sobre a mudança (opcional)
   * @returns {Promise<Object>} Resultado da operação
   */
  async updateProjectProgress(projectId, newProgress, observation = '') {
    try {
      // Validar progresso
      if (newProgress < 0 || newProgress > 100) {
        return {
          success: false,
          message: 'Progresso deve estar entre 0 e 100'
        };
      }

      // Buscar projeto atual para obter progresso anterior e histórico
      const currentProject = await this.getProjectById(projectId);
      if (!currentProject) {
        return {
          success: false,
          message: 'Projeto não encontrado'
        };
      }

      const previousProgress = currentProject.progress || 0;
      const timestamp = new Date().toISOString();
      const currentHistory = currentProject.progressHistory || [];

      // Criar nova entrada no histórico
      const newHistoryEntry = {
        date: timestamp,
        previousProgress: previousProgress,
        newProgress: newProgress,
        change: newProgress - previousProgress,
        observation: observation || '',
        updatedBy: 'Sistema' // Pode ser substituído por usuário logado no futuro
      };

      // Adicionar ao histórico (manter apenas os últimos 100 registros)
      const updatedHistory = [...currentHistory, newHistoryEntry].slice(-100);

      // Atualizar projeto com novo progresso e histórico
      const updateResult = await this.updateProject(projectId, {
        progress: newProgress,
        progressHistory: updatedHistory,
        lastProgressUpdate: timestamp
      });

      return {
        success: updateResult.success,
        project: updateResult.project,
        message: updateResult.success ? 'Progresso atualizado com sucesso' : updateResult.message
      };

    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      return {
        success: false,
        message: error.message || 'Erro interno do servidor'
      };
    }
  }

  /**
   * Buscar histórico de progresso de um projeto
   * @param {string} projectId - ID do projeto
   * @param {number} limit - Limite de registros (padrão: 50)
   * @returns {Promise<Array>} Lista do histórico de progresso
   */
  async getProjectProgressHistory(projectId, limit = 50) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project || !project.progressHistory) {
        return [];
      }

      // Retornar histórico ordenado por data (mais recente primeiro)
      const sortedHistory = project.progressHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);

      return sortedHistory;

    } catch (error) {
      console.error('Erro ao buscar histórico de progresso:', error);
      return [];
    }
  }

  /**
   * Obter dados para gráfico de evolução do progresso
   * @param {string} projectId - ID do projeto
   * @returns {Promise<Object>} Dados formatados para o gráfico
   */
  async getProgressChartData(projectId) {
    try {
      const project = await this.getProjectById(projectId);
      
      if (!project || !project.progressHistory || project.progressHistory.length === 0) {
        return {
          labels: [],
          data: [],
          isEmpty: true
        };
      }

      // Ordenar por data crescente para o gráfico
      const sortedHistory = project.progressHistory.sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      const labels = sortedHistory.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit',
          year: '2-digit'
        });
      });

      const data = sortedHistory.map(item => item.newProgress);

      return {
        labels,
        data,
        isEmpty: false,
        history: sortedHistory
      };

    } catch (error) {
      console.error('Erro ao obter dados do gráfico:', error);
      return {
        labels: [],
        data: [],
        isEmpty: true,
        error: error.message
      };
    }
  }

  /**
   * Obter estatísticas do progresso do projeto
   * @param {string} projectId - ID do projeto
   * @returns {Promise<Object>} Estatísticas do progresso
   */
  async getProgressStats(projectId) {
    try {
      const project = await this.getProjectById(projectId);
      
      if (!project) {
        return null;
      }

      const history = project.progressHistory || [];
      const currentProgress = project.progress || 0;

      // Calcular estatísticas
      const stats = {
        currentProgress: currentProgress,
        totalUpdates: history.length,
        lastUpdate: history.length > 0 ? history[history.length - 1].date : project.createdAt,
        averageChange: 0,
        biggestIncrease: 0,
        biggestDecrease: 0
      };

      if (history.length > 0) {
        const changes = history.map(h => h.change).filter(c => c !== 0);
        
        if (changes.length > 0) {
          stats.averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
          stats.biggestIncrease = Math.max(...changes.filter(c => c > 0), 0);
          stats.biggestDecrease = Math.min(...changes.filter(c => c < 0), 0);
        }
      }

      return stats;

    } catch (error) {
      console.error('Erro ao obter estatísticas do progresso:', error);
      return null;
    }
  }

  /**
   * Buscar fotos do projeto no S3 separadas por categoria
   * @param {string} projectName - Nome do projeto
   * @param {string} category - Categoria da foto ('categoria1', 'categoria2', 'all')
   * @param {number} limit - Limite de itens (padrão: 10)
   * @returns {Promise<Array>} Lista de objetos com informações das fotos
   */
  async getProjectPhotos(projectName, category = 'all', limit = 10) {
    try {
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      
      // Definir prefixos baseados na categoria
      let prefixes = [];
      if (category === 'categoria1' || category === 'all') {
        prefixes.push(`${sanitizedProjectName}/fotos/categoria1/`);
      }
      if (category === 'categoria2' || category === 'all') {
        prefixes.push(`${sanitizedProjectName}/fotos/categoria2/`);
      }
      
      // Se nenhuma categoria específica foi solicitada, buscar na raiz (compatibilidade apenas quando não há categorias)
      if (prefixes.length === 0) {
        prefixes.push(`${sanitizedProjectName}/`);
      }

      let allPhotos = [];
      const seenKeys = new Set(); // Para evitar duplicatas

      // Buscar em cada prefixo
      for (const prefix of prefixes) {
        const params = {
          Bucket: S3_BUCKET,
          Prefix: prefix,
          MaxKeys: 100
        };

        const result = await s3.listObjectsV2(params).promise();
        
        if (result.Contents && result.Contents.length > 0) {
          // Filtrar apenas imagens válidas
          const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

          const photos = result.Contents
            .filter(obj => {
              const key = obj.Key;
              
              // Evitar duplicatas
              if (seenKeys.has(key)) {
                return false;
              }
              
              // Excluir pasta fotoPerfil e documentos
              if (key.includes('/fotoPerfil/') || key.includes('/documentos/')) {
                return false;
              }
              
              // Determinar categoria baseado no caminho
              let photoCategory = 'categoria1';
              if (key.includes('/fotos/categoria2/')) {
                photoCategory = 'categoria2';
              } else if (key.includes('/fotos/categoria1/')) {
                photoCategory = 'categoria1';
              }
              
              // Filtrar por categoria se especificado
              if (category !== 'all' && photoCategory !== category) {
                return false;
              }
              
              // Verificar se é uma imagem válida
              const extension = key.toLowerCase().split('.').pop();
              return validImageExtensions.some(ext => ext === `.${extension}`);
            })
            .map(obj => {
              const key = obj.Key;
              const fileName = key.split('/').pop();
              const extension = fileName.toLowerCase().split('.').pop();
              
              // Marcar como visto
              seenKeys.add(key);
              
              // Determinar categoria
              let photoCategory = 'categoria1';
              if (key.includes('/fotos/categoria2/')) {
                photoCategory = 'categoria2';
              }
              
              return {
                key: obj.Key,
                fileName: fileName,
                category: photoCategory,
                size: obj.Size,
                lastModified: obj.LastModified,
                url: `https://${S3_BUCKET}.s3.${process.env.REACT_APP_AWS_REGION || 'sa-east-1'}.amazonaws.com/${obj.Key}`,
                extension: extension
              };
            });

          allPhotos = allPhotos.concat(photos);
        }
      }

      // Ordenar por data (mais recente primeiro) e limitar
      return allPhotos
        .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
        .slice(0, limit);

    } catch (error) {
      console.error('Erro ao buscar fotos do projeto:', error);
      return [];
    }
  }

  /**
   * Buscar fotos de captura do projeto no S3 (compatibilidade)
   * @param {string} projectName - Nome do projeto
   * @param {number} limit - Limite de fotos (padrão: 10)
   * @returns {Promise<Array>} Lista de URLs das fotos
   */
  async getProjectCapturePhotos(projectName, limit = 10) {
    try {
      const photos = await this.getProjectPhotos(projectName, 'all', limit);
      return photos.map(photo => photo.url);
    } catch (error) {
      console.error('Erro ao buscar fotos do projeto:', error);
      return [];
    }
  }

  /**
   * Buscar fotos por ID do projeto
   * @param {string} projectId - ID do projeto
   * @param {string} category - Categoria da foto ('categoria1', 'categoria2', 'all')
   * @param {number} limit - Limite de itens (padrão: 10)
   * @returns {Promise<Array>} Lista de objetos com informações das fotos
   */
  async getProjectPhotosById(projectId, category = 'all', limit = 10) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        return [];
      }

      return await this.getProjectPhotos(project.projectName, category, limit);

    } catch (error) {
      console.error('Erro ao buscar fotos do projeto por ID:', error);
      return [];
    }
  }

  /**
   * Buscar fotos de captura por ID do projeto (compatibilidade)
   * @param {string} projectId - ID do projeto
   * @param {number} limit - Limite de fotos (padrão: 10)
   * @returns {Promise<Array>} Lista de URLs das fotos
   */
  async getProjectCapturePhotosById(projectId, limit = 10) {
    try {
      const photos = await this.getProjectPhotosById(projectId, 'all', limit);
      return photos.map(photo => photo.url);

    } catch (error) {
      console.error('Erro ao buscar fotos do projeto por ID:', error);
      return [];
    }
  }

  /**
   * Upload de foto para o projeto
   * @param {string} projectName - Nome do projeto
   * @param {File} file - Arquivo de imagem para upload
   * @param {string} category - Categoria da foto ('categoria1' ou 'categoria2')
   * @param {Function} onProgress - Callback para progresso (opcional)
   * @returns {Promise<Object>} Resultado do upload
   */
  async uploadPhoto(projectName, file, category, onProgress = null) {
    try {
      const sanitizedProjectName = this.sanitizeProjectName(projectName);
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `foto-${timestamp}.${fileExtension}`;
      
      // Caminho no S3: projeto/fotos/categoria/arquivo
      const s3Key = `${sanitizedProjectName}/fotos/${category}/${fileName}`;
      
      const uploadParams = {
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'original-name': file.name,
          'photo-category': category,
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
          message: `Foto da ${category === 'categoria1' ? 'Fotos da Obra' : 'Fotos do BIM'} enviada com sucesso`,
          photo: {
            key: s3Key,
            url: result.Location,
            category: category,
            fileName: fileName,
            originalName: file.name,
            size: file.size
          }
        };
      } else {
        const result = await s3.upload(uploadParams).promise();
        
        return {
          success: true,
          message: `Foto da ${category === 'categoria1' ? 'Fotos da Obra' : 'Fotos do BIM'} enviada com sucesso`,
          photo: {
            key: s3Key,
            url: result.Location,
            category: category,
            fileName: fileName,
            originalName: file.name,
            size: file.size
          }
        };
      }

    } catch (error) {
      console.error('Erro no upload da foto:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar foto'
      };
    }
  }
}

const projectServiceInstance = new ProjectService();
export default projectServiceInstance;
