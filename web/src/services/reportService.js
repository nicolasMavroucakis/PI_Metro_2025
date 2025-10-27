import { dynamoDB } from '../config/aws-config';

export const REPORTS_TABLE = process.env.REACT_APP_REPORTS_TABLE || 'metro-bim-reports';

/**
 * Serviço para gerenciamento de relatórios de comparação BIM
 */
class ReportService {
  /**
   * Salvar novo relatório de comparação
   * @param {Object} reportData - Dados do relatório
   * @returns {Promise<Object>} Resultado da operação
   */
  async saveReport(reportData) {
    try {
      const reportId = this.generateReportId();
      const timestamp = new Date().toISOString();
      
      const report = {
        reportId,
        projectId: reportData.projectId,
        projectName: reportData.projectName,
        createdAt: timestamp,
        status: reportData.status, // 'success' ou 'failed'
        
        // Imagens comparadas
        bimImage: {
          url: reportData.bimImage?.url || '',
          fileName: reportData.bimImage?.fileName || 'unknown',
          category: reportData.bimImage?.category || 'categoria2'
        },
        obraImage: {
          url: reportData.obraImage?.url || '',
          fileName: reportData.obraImage?.fileName || 'unknown',
          category: reportData.obraImage?.category || 'categoria1'
        },
        
        // Contexto fornecido pelo usuário
        userContext: reportData.userContext || '',
        
        // Resultado da análise do Gemini
        analysisResult: reportData.analysisResult || null,
        
        // Índices para query otimizada
        GSI1_PK: `project#${reportData.projectId}`,
        GSI1_SK: timestamp,
        
        // Metadados do usuário
        userId: reportData.userId || 'unknown',
        userName: reportData.userName || 'Desconhecido',
        
        // Mensagem de erro (se status for 'failed')
        errorMessage: reportData.errorMessage || null
      };
      
      await dynamoDB.put({
        TableName: REPORTS_TABLE,
        Item: report
      }).promise();
      
      console.log('✅ Relatório salvo com sucesso:', reportId);
      
      return { 
        success: true, 
        reportId, 
        report,
        message: 'Relatório salvo com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao salvar relatório:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Erro ao salvar relatório'
      };
    }
  }
  
  /**
   * Buscar todos os relatórios de um projeto
   * @param {string} projectId - ID do projeto
   * @param {number} limit - Limite de resultados (padrão: 50)
   * @returns {Promise<Object>} Lista de relatórios
   */
  async getProjectReports(projectId, limit = 50) {
    try {
      const result = await dynamoDB.query({
        TableName: REPORTS_TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1_PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `project#${projectId}`
        },
        ScanIndexForward: false, // Ordem decrescente (mais recentes primeiro)
        Limit: limit
      }).promise();
      
      return {
        success: true,
        reports: result.Items || [],
        count: result.Count || 0
      };
    } catch (error) {
      console.error('❌ Erro ao buscar relatórios:', error);
      return { 
        success: false, 
        error: error.message, 
        reports: [],
        count: 0
      };
    }
  }
  
  /**
   * Buscar relatório específico por ID
   * @param {string} reportId - ID do relatório
   * @param {string} projectId - ID do projeto (opcional, para query mais rápida)
   * @returns {Promise<Object>} Dados do relatório
   */
  async getReportById(reportId, projectId = null) {
    try {
      let result;
      
      if (projectId) {
        // Query usando chave primária composta (mais rápido)
        result = await dynamoDB.get({
          TableName: REPORTS_TABLE,
          Key: {
            reportId: reportId,
            projectId: projectId
          }
        }).promise();
        
        if (result.Item) {
          return {
            success: true,
            report: result.Item
          };
        }
      }
      
      // Fallback: scan pela tabela (mais lento, mas funciona sem projectId)
      result = await dynamoDB.scan({
        TableName: REPORTS_TABLE,
        FilterExpression: 'reportId = :id',
        ExpressionAttributeValues: {
          ':id': reportId
        },
        Limit: 1
      }).promise();
      
      if (!result.Items || result.Items.length === 0) {
        return { 
          success: false, 
          message: 'Relatório não encontrado' 
        };
      }
      
      return {
        success: true,
        report: result.Items[0]
      };
    } catch (error) {
      console.error('❌ Erro ao buscar relatório:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Erro ao buscar relatório'
      };
    }
  }
  
  /**
   * Obter estatísticas dos relatórios de um projeto
   * @param {string} projectId - ID do projeto
   * @returns {Promise<Object>} Estatísticas
   */
  async getProjectStats(projectId) {
    try {
      const { reports, success } = await this.getProjectReports(projectId, 1000);
      
      if (!success) {
        return { 
          success: false, 
          message: 'Erro ao buscar relatórios para estatísticas' 
        };
      }
      
      const stats = {
        total: reports.length,
        success: reports.filter(r => r.status === 'success').length,
        failed: reports.filter(r => r.status === 'failed').length,
        avgProgress: 0,
        lastReport: reports[0] || null,
        recentReports: reports.slice(0, 5) // 5 mais recentes
      };
      
      // Calcular média de progresso dos relatórios bem-sucedidos
      const successReports = reports.filter(r => r.status === 'success' && r.analysisResult);
      if (successReports.length > 0) {
        const totalProgress = successReports.reduce((sum, r) => {
          return sum + (r.analysisResult?.percentual_conclusao || 0);
        }, 0);
        stats.avgProgress = Math.round(totalProgress / successReports.length);
      }
      
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Erro ao calcular estatísticas'
      };
    }
  }
  
  /**
   * Deletar relatório
   * @param {string} reportId - ID do relatório
   * @param {string} projectId - ID do projeto
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteReport(reportId, projectId) {
    try {
      await dynamoDB.delete({
        TableName: REPORTS_TABLE,
        Key: {
          reportId: reportId,
          projectId: projectId
        }
      }).promise();
      
      return { 
        success: true, 
        message: 'Relatório deletado com sucesso' 
      };
    } catch (error) {
      console.error('❌ Erro ao deletar relatório:', error);
      return { 
        success: false, 
        error: error.message,
        message: 'Erro ao deletar relatório'
      };
    }
  }
  
  /**
   * Buscar todos os projetos que têm relatórios
   * @returns {Promise<Object>} Lista de projetos
   */
  async getProjectsWithReports() {
    try {
      // Scan para pegar todos os relatórios e extrair projetos únicos
      const result = await dynamoDB.scan({
        TableName: REPORTS_TABLE,
        ProjectionExpression: 'projectId, projectName'
      }).promise();
      
      // Criar mapa de projetos únicos
      const projectsMap = new Map();
      result.Items.forEach(item => {
        if (!projectsMap.has(item.projectId)) {
          projectsMap.set(item.projectId, {
            projectId: item.projectId,
            projectName: item.projectName
          });
        }
      });
      
      const projects = Array.from(projectsMap.values());
      
      return {
        success: true,
        projects: projects,
        count: projects.length
      };
    } catch (error) {
      console.error('❌ Erro ao buscar projetos:', error);
      return { 
        success: false, 
        error: error.message,
        projects: [],
        count: 0
      };
    }
  }
  
  /**
   * Gerar ID único para relatório
   * @returns {string} ID único
   */
  generateReportId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `rpt_${timestamp}_${random}`;
  }
  
  /**
   * Formatar data para exibição
   * @param {string} isoDate - Data ISO
   * @returns {string} Data formatada
   */
  formatDate(isoDate) {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export default new ReportService();

