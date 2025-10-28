import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import projectService from '../services/projectService';
import '../Style/Home-new.css';

function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Carregar projetos do DynamoDB
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const projectsData = await projectService.getAllProjects();
        setProjects(projectsData);
      } catch (err) {
        console.error('Erro ao carregar projetos:', err);
        setError('Erro ao carregar projetos. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Função para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
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

  // Função para calcular progresso baseado nas datas
  const calculateProgress = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end - start;
    const elapsed = now - start;
    
    return Math.round((elapsed / total) * 100);
  };

  // Função para verificar se o projeto tem imagem real
  const hasRealImage = (project) => {
    return project.imageUrl && 
           !project.imageUrl.includes('placeholder') && 
           !project.imageUrl.includes('via.placeholder.com');
  };

  // Função para gerar imagem placeholder baseada no nome do projeto
  const getProjectImage = (project) => {
    if (hasRealImage(project)) {
      return project.imageUrl;
    }
    
    // Gerar cor baseada no hash do nome do projeto
    let hash = 0;
    for (let i = 0; i < project.projectName.length; i++) {
      hash = project.projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.abs(hash).toString(16).substring(0, 6);
    
    return `https://via.placeholder.com/300x200/${color}/white?text=${encodeURIComponent(project.projectName)}`;
  };

  // Menu items baseado em permissões
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const menuItems = [
    { icon: '🏠', label: 'Home', active: true, path: '/home' },
    // Item condicional - apenas para admin
    ...(user.isAdmin ? [{ icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' }] : []),
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' }
  ];

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  // Função de logout
  const handleLogout = () => {
    // Limpar todos os dados do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    
    // Redirecionar para login
    navigate('/login');
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownOpen && !event.target.closest('.user-menu-container')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userDropdownOpen]);

  return (
    <Layout menuItems={menuItems}>
        <header className="main-header">
          <h1>Home</h1>
          <div className="header-controls">
            <button className="theme-toggle">☀️</button>
            
            {/* User Menu com Dropdown */}
            <div className="user-menu-container">
              <button 
                className="user-menu"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                👤
              </button>
              
              {userDropdownOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-avatar">👤</div>
                    <div className="user-info">
                      <strong>{user.name || user.username || 'Usuário'}</strong>
                      <small>{user.email || 'Email não disponível'}</small>
                    </div>
                  </div>
                  
                  <div className="user-dropdown-divider"></div>
                  
                  <div className="user-dropdown-items">
                    {user.isAdmin && (
                      <div className="user-dropdown-badge">
                        🛡️ Administrador
                      </div>
                    )}
                    <button 
                      className="user-dropdown-item"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigate('/profile');
                      }}
                    >
                      <span>👤</span> Meu Perfil
                    </button>
                    <button 
                      className="user-dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <span>🚪</span> Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button className="settings">⚙️</button>
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="loading-container" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Carregando projetos...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-container" style={{ textAlign: 'center', padding: '2rem', color: '#f44336' }}>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
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
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Projects Grid */}
        {!loading && !error && (
          <div className="projects-grid">
            {projects.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Nenhum projeto encontrado.</p>
                <button 
                  onClick={() => navigate('/add-project')}
                  style={{ 
                    marginTop: '1rem', 
                    padding: '0.5rem 1rem', 
                    backgroundColor: '#4CAF50', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Criar Primeiro Projeto
                </button>
              </div>
            ) : (
              projects.map((project) => {
                const progress = calculateProgress(project.startDate, project.endDate);
                const progressColor = getProgressColor(project.status);
                
                return (
                  <div 
                    key={project.projectId} 
                    className="project-card"
                    onClick={() => handleProjectClick(project.projectId)}
                    style={{ cursor: 'pointer'}}
                  >
                    <div className="project-image">
                      <img 
                        src={getProjectImage(project)} 
                        alt={project.projectName}
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/300x200/9E9E9E/white?text=${encodeURIComponent(project.projectName)}`;
                        }}
                      />
                      {!hasRealImage(project) && (
                        <div className="construction-icon">
                          🏗️
                        </div>
                      )}
                    </div>
                    <div className="project-content">
                      <div className="project-main-info">
                        <h3 className="project-title">{project.projectName}</h3>
                        <p className="project-subtitle">
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        </p>
                        
                        <div className="project-info">
                          <div className="info-row">
                            <span className="info-label">Última Alteração:</span>
                            <span className="info-value">{formatDate(project.updatedAt)}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Status:</span>
                            <span className="info-value">{project.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="project-progress-wrapper">
                        <div className="progress-section">
                          <div className="progress-header">
                            <span className="progress-label">Progresso</span>
                            <span className="progress-percentage">{progress}%</span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: progressColor
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
    </Layout>
  );
}

export default Home;
