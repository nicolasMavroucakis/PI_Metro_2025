import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import projectService from '../services/projectService';
import '../Style/ProjectDetails.css';

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // Estados para dados do projeto
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], data: [], isEmpty: true });
  const [capturePhotos, setCapturePhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  
  // Estados para edição de progresso
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [newProgress, setNewProgress] = useState('');
  const [progressObservation, setProgressObservation] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Carregar dados do projeto
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        setError('ID do projeto não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Carregar dados do projeto
        const projectData = await projectService.getProjectById(projectId);
        if (!projectData) {
          setError('Projeto não encontrado');
          setLoading(false);
          return;
        }

        setProject(projectData);

        // Carregar dados do gráfico de progresso
        const chartInfo = await projectService.getProgressChartData(projectId);
        setChartData(chartInfo);

        // Carregar fotos de captura do projeto
        setLoadingPhotos(true);
        try {
          const photos = await projectService.getProjectCapturePhotosById(projectId, 6);
          setCapturePhotos(photos);
        } catch (photoError) {
          console.error('Erro ao carregar fotos:', photoError);
          // Não falhar a operação principal se as fotos não carregarem
        } finally {
          setLoadingPhotos(false);
        }

      } catch (err) {
        console.error('Erro ao carregar dados do projeto:', err);
        setError('Erro ao carregar dados do projeto. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId]);

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para determinar cor do progresso baseado no status
  const getProgressColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'concluído':
      case 'concluido':
        return '#4CAF50'; // Verde
      case 'em andamento':
      case 'em_andamento':
        return '#FFEB3B'; // Amarelo
      case 'parado':
      case 'pausado':
        return '#F44336'; // Vermelho
      case 'planejamento':
        return '#2196F3'; // Azul
      default:
        return '#9E9E9E'; // Cinza
    }
  };

  // Função para gerar imagem placeholder
  const getProjectImage = (project) => {
    if (project?.imageUrl) {
      return project.imageUrl;
    }
    
    let hash = 0;
    const name = project?.projectName || 'Projeto';
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.abs(hash).toString(16).substring(0, 6);
    
    return `https://via.placeholder.com/120x90/${color}/white?text=${encodeURIComponent(name)}`;
  };

  // Função para atualizar progresso
  const handleUpdateProgress = async () => {
    if (!newProgress || newProgress < 0 || newProgress > 100) {
      alert('Por favor, insira um valor válido entre 0 e 100');
      return;
    }

    try {
      setUpdatingProgress(true);
      
      const result = await projectService.updateProjectProgress(
        projectId,
        parseInt(newProgress),
        progressObservation
      );

      if (result.success) {
        // Atualizar dados do projeto
        setProject(result.project);
        
        // Recarregar dados do gráfico
        const chartInfo = await projectService.getProgressChartData(projectId);
        setChartData(chartInfo);
        
        // Recarregar fotos (pode ter novas capturas)
        try {
          const photos = await projectService.getProjectCapturePhotosById(projectId, 6);
          setCapturePhotos(photos);
        } catch (photoError) {
          console.error('Erro ao recarregar fotos:', photoError);
        }
        
        // Fechar modal e limpar campos
        setShowProgressModal(false);
        setNewProgress('');
        setProgressObservation('');
        
        alert('Progresso atualizado com sucesso!');
      } else {
        alert(`Erro ao atualizar progresso: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      alert('Erro ao atualizar progresso. Tente novamente.');
    } finally {
      setUpdatingProgress(false);
    }
  };

  // Função para abrir modal de progresso
  const handleOpenProgressModal = () => {
    setNewProgress(project?.progress?.toString() || '0');
    setProgressObservation('');
    setShowProgressModal(true);
  };

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' },
    { icon: '👤', label: 'Usuário', path: '/profile' }
  ];

  const handleNewCapture = () => {
    alert('Funcionalidade de Nova Captura será implementada');
  };

  const handleGenerateReport = () => {
    alert('Funcionalidade de Gerar Relatório será implementada');
  };

  const handleViewMore = (section) => {
    alert(`Ver mais ${section} será implementado`);
  };

  // Se estiver carregando
  if (loading) {
    return (
      <Layout menuItems={menuItems}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando dados do projeto...</p>
        </div>
      </Layout>
    );
  }

  // Se houver erro
  if (error) {
    return (
      <Layout menuItems={menuItems}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#f44336' }}>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/home')}
            style={{ 
              marginTop: '1rem', 
              padding: '0.5rem 1rem', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Voltar para Home
          </button>
        </div>
      </Layout>
    );
  }

  // Se não encontrou o projeto
  if (!project) {
    return (
      <Layout menuItems={menuItems}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Projeto não encontrado</p>
          <button 
            onClick={() => navigate('/home')}
            style={{ 
              marginTop: '1rem', 
              padding: '0.5rem 1rem', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Voltar para Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout menuItems={menuItems}>
      <header className="project-header">
        <h1>Projetos</h1>
      </header>
      
      <main className="project-details-main">
        <div className="project-title-section">
          <h2 className="project-main-title">{project.projectName}</h2>
        </div>

        <div className="project-content-grid">
          {/* Progresso da Obra */}
          <div className="progress-card">
            <h3 className="card-title">Progresso da Obra</h3>
            <div className="progress-circle-container">
              <div className="progress-circle">
                <svg viewBox="0 0 120 120" className="progress-svg">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={getProgressColor(project.status)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(project.progress || 0) * 3.14} 314`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="progress-text">
                  <span className="progress-percentage">{project.progress || 0}%</span>
                </div>
              </div>
            </div>
            <button 
              className="view-more-btn" 
              onClick={handleOpenProgressModal}
            >
              Atualizar Progresso
            </button>
          </div>

          {/* Últimas Capturas */}
          <div className="captures-card">
            <div className="card-header">
              <h3 className="card-title">Últimas Capturas</h3>
              <span className="camera-icon">📷</span>
            </div>
            
            {loadingPhotos ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p>Carregando fotos...</p>
              </div>
            ) : capturePhotos.length > 0 ? (
              <>
                <div className="captures-grid">
                  {capturePhotos.slice(0, 3).map((photoUrl, index) => (
                    <div key={index} className="capture-item">
                      <img 
                        src={photoUrl} 
                        alt={`Captura ${index + 1}`}
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/120x90/9E9E9E/white?text=Erro+Carregamento`;
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                <p className="last-capture">
                  {capturePhotos.length} foto{capturePhotos.length !== 1 ? 's' : ''} disponível{capturePhotos.length !== 1 ? 'is' : ''}
                </p>
              </>
            ) : (
              <div className="captures-empty-state">
                <p>Nenhuma captura adicionada ainda</p>
              </div>
            )}
            
            <div className="captures-buttons">
              <button className="view-more-btn" onClick={() => handleViewMore('capturas')}>
                Ver Mais
              </button>
              <button className="new-capture-btn-small" onClick={handleNewCapture}>
                Nova Captura
              </button>
            </div>
          </div>

          {/* Alertas */}
          <div className="alerts-card">
            <div className="card-header">
              <h3 className="card-title">Alertas</h3>
              <span className="alert-icon">⚠️</span>
            </div>
            <div className="alert-number">
              <span className="alert-count">{project.problems || 0}</span>
              <p className="alert-description">Problemas detectados</p>
            </div>
            <button className="view-more-btn" onClick={() => handleViewMore('alertas')}>
              Ver Mais
            </button>
          </div>

          {/* Próximas Etapas */}
          <div className="next-steps-card">
            <div className="card-header">
              <h3 className="card-title">Informações do Projeto</h3>
              <span className="calendar-icon">📅</span>
            </div>
            <div className="steps-list">
              <div className="step-item active">
                <div className="step-indicator"></div>
                <div className="step-content">
                  <h4 className="step-title">Início do Projeto</h4>
                  <p className="step-dates">{formatDate(project.startDate)}</p>
                </div>
              </div>
              <div className="step-item pending">
                <div className="step-indicator"></div>
                <div className="step-content">
                  <h4 className="step-title">Prazo Final</h4>
                  <p className="step-dates">{formatDate(project.endDate)}</p>
                </div>
              </div>
              <div className="step-item active">
                <div className="step-indicator"></div>
                <div className="step-content">
                  <h4 className="step-title">Última Atualização</h4>
                  <p className="step-dates">{formatDate(project.updatedAt)}</p>
                </div>
              </div>
            </div>
            <button className="view-more-btn" onClick={() => handleViewMore('etapas')}>
              Ver Mais
            </button>
          </div>
        </div>

        {/* Gráfico de Progresso */}
        <div className="chart-section">
          <div className="chart-header">
            <h3>Evolução do Progresso</h3>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot executed"></span>
                <span>Progresso Real</span>
              </div>
            </div>
          </div>
          <div className="chart-container">
            {chartData.isEmpty ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <p>Nenhum histórico de progresso disponível ainda.</p>
                <p>Atualize o progresso do projeto para começar a ver a evolução.</p>
              </div>
            ) : (
              <>
                <div className="chart-y-axis">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
                <div className="chart-area">
                  <svg viewBox="0 0 600 200" className="progress-chart">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="60" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 60 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="600" height="200" fill="url(#grid)" />
                    
                    {/* Progress line */}
                    {chartData.data.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#1976D2"
                        strokeWidth="3"
                        points={chartData.data.map((value, index) => {
                          const x = (index / (chartData.data.length - 1)) * 580 + 10;
                          const y = 200 - (value / 100) * 180 - 10;
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                    )}
                    
                    {/* Data points */}
                    {chartData.data.map((value, index) => {
                      const x = (index / Math.max(chartData.data.length - 1, 1)) * 580 + 10;
                      const y = 200 - (value / 100) * 180 - 10;
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#1976D2"
                          stroke="white"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                </div>
                <div className="chart-x-axis">
                  {chartData.labels.map((label, index) => (
                    <span key={index} style={{ fontSize: '12px' }}>{label}</span>
                  ))}
                </div>
              </>
            )}
          </div>
          <button className="generate-report-btn" onClick={handleGenerateReport}>
            Gerar Relatório
          </button>
        </div>

        {/* Observações */}
        <div className="observations-section">
          <h3>Observações</h3>
          <p>{project.observations || 'Nenhuma observação adicional.'}</p>
        </div>

      </main>

      {/* Modal de Atualização de Progresso */}
      {showProgressModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              minWidth: '400px',
              maxWidth: '500px'
            }}
          >
            <h3>Atualizar Progresso do Projeto</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="progress" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Novo Progresso (0-100%):
              </label>
              <input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
                placeholder="Ex: 75"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="observation" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Observação (opcional):
              </label>
              <textarea
                id="observation"
                value={progressObservation}
                onChange={(e) => setProgressObservation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
                placeholder="Descreva as mudanças ou observações sobre o progresso..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowProgressModal(false)}
                disabled={updatingProgress}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: updatingProgress ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateProgress}
                disabled={updatingProgress}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: updatingProgress ? 'not-allowed' : 'pointer'
                }}
              >
                {updatingProgress ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default ProjectDetails;

