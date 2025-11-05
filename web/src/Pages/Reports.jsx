import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import projectService from '../services/projectService';
import reportService from '../services/reportService';
import '../Style/Reports.css';

function Reports() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Estados
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState(null);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' }
  ];

  // Carregar lista de projetos
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const allProjects = await projectService.getAllProjects();
        
        if (allProjects && allProjects.length > 0) {
          setProjects(allProjects);
          
          // Se tem projectId na URL, seleciona automaticamente
          const urlProjectId = searchParams.get('projectId');
          if (urlProjectId) {
            const project = allProjects.find(p => p.projectId === urlProjectId);
            if (project) {
              setSelectedProject(project);
            }
          }
        } else {
          setError('Nenhum projeto encontrado');
        }
      } catch (err) {
        console.error('Erro ao carregar projetos:', err);
        setError('Erro ao carregar projetos');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [searchParams]);

  // Carregar relatórios quando projeto é selecionado
  useEffect(() => {
    if (selectedProject) {
      loadProjectReports();
    }
  }, [selectedProject]);

  const loadProjectReports = async () => {
    if (!selectedProject) return;
    
    try {
      setLoadingReports(true);
      setError(null);
      
      // Carregar relatórios e estatísticas em paralelo
      const [reportsResult, statsResult] = await Promise.all([
        reportService.getProjectReports(selectedProject.projectId, 100),
        reportService.getProjectStats(selectedProject.projectId)
      ]);
      
      if (reportsResult.success) {
        setReports(reportsResult.reports);
      } else {
        setError('Erro ao carregar relatórios');
      }
      
      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
      setError('Erro ao carregar relatórios');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    if (projectId) {
      const project = projects.find(p => p.projectId === projectId);
      setSelectedProject(project);
    } else {
      setSelectedProject(null);
      setReports([]);
      setStats(null);
    }
  };

  const handleViewReport = (reportId) => {
    navigate(`/reports/${reportId}?projectId=${selectedProject.projectId}`);
  };

  const handleDeleteReport = async (reportId) => {
    const confirmed = window.confirm(
      '⚠️ Tem certeza que deseja deletar este relatório?\n\nEsta ação não pode ser desfeita.'
    );
    
    if (!confirmed) return;

    try {
      setLoadingReports(true);
      
      const result = await reportService.deleteReport(reportId, selectedProject.projectId);
      
      if (result.success) {
        alert('✅ Relatório deletado com sucesso!');
        
        // Recarregar relatórios
        const reportsData = await reportService.getProjectReports(selectedProject.projectId);
        if (reportsData.success) {
          setReports(reportsData.reports || []);
          
          // Recalcular estatísticas
          const successCount = reportsData.reports.filter(r => r.status === 'success').length;
          const failedCount = reportsData.reports.filter(r => r.status === 'failed').length;
          setStats({
            total: reportsData.count || 0,
            success: successCount,
            failed: failedCount
          });
        }
      } else {
        alert(`❌ Erro ao deletar relatório: ${result.message}`);
      }
    } catch (err) {
      console.error('Erro ao deletar relatório:', err);
      alert('❌ Erro ao deletar relatório. Tente novamente.');
    } finally {
      setLoadingReports(false);
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrar relatórios
  const filteredReports = reports.filter(report => {
    // Filtro por status
    if (statusFilter !== 'all' && report.status !== statusFilter) {
      return false;
    }
    
    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        report.reportId.toLowerCase().includes(term) ||
        (report.userContext && report.userContext.toLowerCase().includes(term)) ||
        formatDate(report.createdAt).includes(term)
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <Layout menuItems={menuItems}>
        <div className="reports-loading">
          <p>Carregando projetos...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout menuItems={menuItems}>
      <div className="reports-container">
        <header className="reports-header">
          <h1>📊 Relatórios de Comparação BIM</h1>
          <p className="subtitle">Visualize o histórico de análises realizadas com IA</p>
        </header>

        <main className="reports-main">
          {/* Seletor de Projeto */}
          <div className="project-selector-section">
            <label htmlFor="project-select">Selecionar Projeto:</label>
            <select
              id="project-select"
              value={selectedProject?.projectId || ''}
              onChange={handleProjectChange}
              className="project-select"
            >
              <option value="">-- Selecione um projeto --</option>
              {projects.map(project => (
                <option key={project.projectId} value={project.projectId}>
                  {project.projectName}
                </option>
              ))}
            </select>
          </div>

          {/* Estatísticas */}
          {selectedProject && stats && (
            <div className="stats-section">
              <h2>📈 Estatísticas</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total de Relatórios</div>
                  </div>
                </div>
                <div className="stat-card success">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.success}</div>
                    <div className="stat-label">Bem-Sucedidos</div>
                  </div>
                </div>
                <div className="stat-card failed">
                  <div className="stat-icon">❌</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.failed}</div>
                    <div className="stat-label">Com Falha</div>
                  </div>
                </div>
                <div className="stat-card progress">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.avgProgress}%</div>
                    <div className="stat-label">Progresso Médio</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          {selectedProject && reports.length > 0 && (
            <div className="filters-section">
              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todos</option>
                  <option value="success">Sucesso</option>
                  <option value="failed">Falha</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Buscar:</label>
                <input
                  type="text"
                  placeholder="ID, contexto ou data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          )}

          {/* Lista de Relatórios */}
          {selectedProject && (
            <div className="reports-list-section">
              {loadingReports ? (
                <div className="reports-loading">
                  <p>Carregando relatórios...</p>
                </div>
              ) : error ? (
                <div className="reports-error">
                  <p>{error}</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="reports-empty">
                  <div className="empty-icon">📭</div>
                  <h3>Nenhum relatório encontrado</h3>
                  <p>
                    {reports.length === 0
                      ? 'Este projeto ainda não possui relatórios de comparação.'
                      : 'Nenhum relatório corresponde aos filtros aplicados.'}
                  </p>
                  {reports.length === 0 && (
                    <button
                      className="btn-create-report"
                      onClick={() => navigate(`/project/${selectedProject.projectId}/bim-comparison`)}
                    >
                      🤖 Criar Primeira Comparação
                    </button>
                  )}
                </div>
              ) : (
                <div className="reports-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>ID do Relatório</th>
                        <th>Progresso</th>
                        <th>Data</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((report) => (
                        <tr key={report.reportId}>
                          <td>
                            <span className={`status-badge ${report.status}`}>
                              {report.status === 'success' ? '✅ Sucesso' : '❌ Falha'}
                            </span>
                          </td>
                          <td className="report-id">
                            <code>{report.reportId}</code>
                          </td>
                          <td>
                            {report.status === 'success' && report.analysisResult ? (
                              <div className="progress-cell">
                                <div className="progress-bar-small">
                                  <div
                                    className="progress-fill-small"
                                    style={{ width: `${report.analysisResult.percentual_conclusao_geral || report.analysisResult.percentual_conclusao || 0}%` }}
                                  />
                                </div>
                                <span className="progress-text-small">
                                  {report.analysisResult.percentual_conclusao_geral || report.analysisResult.percentual_conclusao || 0}%
                                </span>
                              </div>
                            ) : (
                              <span className="na-text">N/A</span>
                            )}
                          </td>
                          <td>{formatDate(report.createdAt)}</td>
                          <td>
                            <div className="action-buttons-cell">
                              <button
                                className="btn-view"
                                onClick={() => handleViewReport(report.reportId)}
                                title="Ver relatório"
                              >
                                👁️ Ver
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDeleteReport(report.reportId)}
                                title="Deletar relatório"
                              >
                                🗑️ Deletar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Mensagem inicial quando nenhum projeto selecionado */}
          {!selectedProject && !loading && (
            <div className="no-selection">
              <div className="no-selection-icon">🔍</div>
              <h3>Selecione um projeto</h3>
              <p>Escolha um projeto acima para visualizar seus relatórios de comparação BIM.</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}

export default Reports;

