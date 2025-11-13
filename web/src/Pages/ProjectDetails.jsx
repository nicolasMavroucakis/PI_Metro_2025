import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import projectService from '../services/projectService';
import '../Style/ProjectDetails.css';
import {
  FolderOpen,
  Bot,
  AlertTriangle,
  Calendar,
  Camera,
  HardHat,
  Building2
} from 'lucide-react';

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
  
  // Estados para fotos
  const [showNewPhotoModal, setShowNewPhotoModal] = useState(false);
  const [showViewMoreModal, setShowViewMoreModal] = useState(false);
  const [photoCategory, setPhotoCategory] = useState('all');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [allPhotos, setAllPhotos] = useState([]);
  const [loadingAllPhotos, setLoadingAllPhotos] = useState(false);
  
  // Estados para alertas
  const [showAddAlertModal, setShowAddAlertModal] = useState(false);
  const [newAlertText, setNewAlertText] = useState('');
  const [newAlertLevel, setNewAlertLevel] = useState('amarelo');
  const [addingAlert, setAddingAlert] = useState(false);
  const [alerts, setAlerts] = useState([]);

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
        
        // Carregar alertas do projeto
        setAlerts(projectData.alerts || []);

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
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' }
  ];

  const handleNewCapture = () => {
    setShowNewPhotoModal(true);
  };

  const handleGenerateReport = () => {
    alert('Funcionalidade de Gerar Relatório será implementada');
  };

  const handleViewMore = (section) => {
    if (section === 'capturas') {
      setShowViewMoreModal(true);
      loadAllPhotos('all');
    } else {
      alert(`Ver mais ${section} será implementado`);
    }
  };

  // Carregar todas as fotos para o modal "Ver Mais"
  const loadAllPhotos = async (category) => {
    try {
      setLoadingAllPhotos(true);
      const photos = await projectService.getProjectPhotosById(projectId, category, 50);
      setAllPhotos(photos);
      setPhotoCategory(category);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoadingAllPhotos(false);
    }
  };

  // Upload de nova foto
  const handlePhotoUpload = async (file, category) => {
    if (!file || !project) return;

    try {
      setUploadingPhoto(true);
      setUploadProgress(0);

      const result = await projectService.uploadPhoto(
        project.projectName,
        file,
        category,
        (progress) => setUploadProgress(progress)
      );

      if (result.success) {
        alert(result.message);
        setShowNewPhotoModal(false);
        
        // Recarregar fotos de captura
        try {
          const photos = await projectService.getProjectCapturePhotosById(projectId, 6);
          setCapturePhotos(photos);
        } catch (photoError) {
          console.error('Erro ao recarregar fotos:', photoError);
        }
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar foto');
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  // Filtrar fotos por categoria no modal "Ver Mais"
  const handleFilterPhotos = (category) => {
    loadAllPhotos(category);
  };

  // Obter nome da categoria
  const getCategoryName = (category) => {
    switch (category) {
      case 'categoria1':
        return 'Fotos da Obra';
      case 'categoria2':
        return 'Fotos do BIM';
      default:
        return 'Todas';
    }
  };

  // Adicionar novo alerta
  const handleAddAlert = async () => {
    if (!newAlertText.trim()) {
      alert('Por favor, digite o texto do alerta');
      return;
    }

    try {
      setAddingAlert(true);
      
      const newAlert = {
        id: Date.now().toString(),
        text: newAlertText,
        level: newAlertLevel,
        createdAt: new Date().toISOString(),
        createdBy: localStorage.getItem('userName') || 'Usuário'
      };

      const updatedAlerts = [...alerts, newAlert];
      
      // Salvar no DynamoDB
      const result = await projectService.updateProject(projectId, {
        alerts: updatedAlerts
      });

      if (result.success) {
        setAlerts(updatedAlerts);
        setNewAlertText('');
        setNewAlertLevel('amarelo');
        setShowAddAlertModal(false);
        alert('Alerta adicionado com sucesso!');
      } else {
        alert(`Erro ao adicionar alerta: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar alerta:', error);
      alert('Erro ao adicionar alerta');
    } finally {
      setAddingAlert(false);
    }
  };

  // (removido) handleDeleteAlert não é mais utilizado

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <div className="project-header-actions">
          <button 
            className="documents-button"
            onClick={() => navigate(`/project/${projectId}/documents`)}
            title="Ver documentos do projeto"
          >
            <FolderOpen size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Documentos
          </button>
          <button 
            className="bim-comparison-button"
            onClick={() => navigate(`/project/${projectId}/bim-comparison`)}
            title="Comparação BIM com IA - Análise de Progresso e Conformidade"
          >
            <Bot size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Comparação IA
          </button>
        </div>
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
              <span className="camera-icon"><Camera size={20} /></span>
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
              <span className="alert-icon"><AlertTriangle size={20} /></span>
            </div>
            <div className="alerts-content">
              {alerts.length === 0 ? (
                <div className="no-alerts">
                  <p className="alert-description">Nenhum alerta no momento</p>
                </div>
              ) : (
                <div className="alerts-list">
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className={`alert-item alert-${alert.level}`}>
                      <div className="alert-indicator"></div>
                      <div className="alert-text">{alert.text}</div>
                    </div>
                  ))}
                  {alerts.length > 3 && (
                    <p className="more-alerts">+{alerts.length - 3} mais alerta(s)</p>
                  )}
                </div>
              )}
            </div>
            <div className="alerts-actions">
              <button className="add-alert-btn" onClick={() => setShowAddAlertModal(true)}>
                + Adicionar Alerta
              </button>
            </div>
          </div>

          {/* Próximas Etapas */}
          <div className="next-steps-card">
            <div className="card-header">
              <h3 className="card-title">Informações do Projeto</h3>
              <span className="calendar-icon"><Calendar size={20} /></span>
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

      </main>

      {/* Modal de Nova Foto */}
      {showNewPhotoModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Nova Foto</h3>
            <p>Escolha a categoria da foto que deseja adicionar:</p>
            
            <div className="capture-type-options">
              <div className="capture-option">
                <h4><HardHat size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Fotos da Obra</h4>
                <p>Imagens do progresso da construção</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handlePhotoUpload(file, 'categoria1');
                  }}
                  style={{ display: 'none' }}
                  id="photo-categoria1-upload"
                />
                <button 
                  className="action-button primary"
                  onClick={() => document.getElementById('photo-categoria1-upload').click()}
                  disabled={uploadingPhoto}
                >
                  Selecionar Foto
                </button>
              </div>
              
              <div className="capture-option">
                <h4><Building2 size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Fotos do BIM</h4>
                <p>Imagens de modelos e desenhos técnicos</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handlePhotoUpload(file, 'categoria2');
                  }}
                  style={{ display: 'none' }}
                  id="photo-categoria2-upload"
                />
                <button 
                  className="action-button primary"
                  onClick={() => document.getElementById('photo-categoria2-upload').click()}
                  disabled={uploadingPhoto}
                >
                  Selecionar Foto
                </button>
              </div>
            </div>

            {uploadingPhoto && (
              <div className="upload-progress">
                <p>Enviando foto... {uploadProgress}%</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="action-button secondary"
                onClick={() => setShowNewPhotoModal(false)}
                disabled={uploadingPhoto}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ver Mais Fotos */}
      {showViewMoreModal && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>Todas as Fotos</h3>
              <button 
                className="close-button"
                onClick={() => setShowViewMoreModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="capture-filters">
              <button 
                className={`filter-button ${photoCategory === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterPhotos('all')}
              >
                Todas
              </button>
              <button 
                className={`filter-button ${photoCategory === 'categoria1' ? 'active' : ''}`}
                onClick={() => handleFilterPhotos('categoria1')}
              >
                <HardHat size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Fotos da Obra
              </button>
              <button 
                className={`filter-button ${photoCategory === 'categoria2' ? 'active' : ''}`}
                onClick={() => handleFilterPhotos('categoria2')}
              >
                <Building2 size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Fotos do BIM
              </button>
            </div>

            <div className="captures-content">
              {loadingAllPhotos ? (
                <div className="loading-captures">
                  <p>Carregando fotos...</p>
                </div>
              ) : allPhotos.length === 0 ? (
                <div className="empty-captures">
                  <p>Nenhuma foto encontrada.</p>
                </div>
              ) : (
                <div className="captures-grid-large">
                  {allPhotos.map((photo, index) => (
                    <div key={index} className="capture-item-large">
                      <div className="capture-preview">
                        <img 
                          src={photo.url} 
                          alt={photo.fileName}
                          onError={(e) => {
                            e.target.src = `https://via.placeholder.com/150x100/9E9E9E/white?text=Erro`;
                          }}
                        />
                      </div>
                      <div className="capture-info">
                        <h5 className="capture-name" title={photo.fileName}>
                          {photo.fileName}
                        </h5>
                        <p className="capture-details">
                          {getCategoryName(photo.category)} • {formatFileSize(photo.size)} • {new Date(photo.lastModified).toLocaleDateString('pt-BR')}
                        </p>
                        <div className="capture-actions">
                          <button 
                            className="action-button small"
                            onClick={() => window.open(photo.url, '_blank')}
                          >
                            Ver Foto
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Modal de Adicionar Alerta */}
      {showAddAlertModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Adicionar Novo Alerta</h3>
              <button 
                className="close-button"
                onClick={() => {
                  setShowAddAlertModal(false);
                  setNewAlertText('');
                  setNewAlertLevel('amarelo');
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="form-group">
                <label>Nível do Alerta:</label>
                <div className="alert-level-options">
                  <button
                    className={`alert-level-btn alert-level-verde ${newAlertLevel === 'verde' ? 'selected' : ''}`}
                    onClick={() => setNewAlertLevel('verde')}
                  >
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#43a047', marginRight: 8 }} /> Verde
                    <span className="level-description">Informativo</span>
                  </button>
                  <button
                    className={`alert-level-btn alert-level-amarelo ${newAlertLevel === 'amarelo' ? 'selected' : ''}`}
                    onClick={() => setNewAlertLevel('amarelo')}
                  >
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#fbc02d', marginRight: 8 }} /> Amarelo
                    <span className="level-description">Atenção</span>
                  </button>
                  <button
                    className={`alert-level-btn alert-level-vermelho ${newAlertLevel === 'vermelho' ? 'selected' : ''}`}
                    onClick={() => setNewAlertLevel('vermelho')}
                  >
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#e53935', marginRight: 8 }} /> Vermelho
                    <span className="level-description">Crítico</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Descrição do Alerta:</label>
                <textarea
                  className="alert-textarea"
                  value={newAlertText}
                  onChange={(e) => setNewAlertText(e.target.value)}
                  placeholder="Digite a descrição do alerta..."
                  rows={4}
                  maxLength={200}
                />
                <small className="char-counter">
                  {newAlertText.length}/200 caracteres
                </small>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowAddAlertModal(false);
                  setNewAlertText('');
                  setNewAlertLevel('amarelo');
                }}
                disabled={addingAlert}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddAlert}
                disabled={addingAlert || !newAlertText.trim()}
                className="btn-primary"
              >
                {addingAlert ? 'Adicionando...' : 'Adicionar Alerta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default ProjectDetails;

