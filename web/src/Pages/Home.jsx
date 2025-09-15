import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import '../Style/Home-new.css';

function Home() {
  const navigate = useNavigate();
  
  const projects = [
    {
      id: 1,
      title: 'Expansão Linha 2 - Verde',
      subtitle: 'Estação Vila Formosa',
      image: 'https://via.placeholder.com/300x200/4CAF50/white?text=Linha+2+Verde',
      lastUpdate: '20/08/2025',
      status: 'Em Andamento',
      progress: 80,
      progressColor: '#4CAF50'
    },
    {
      id: 2,
      title: 'Expansão Linha 3 - Vermelha',
      subtitle: 'Estação Tatuapé',
      image: 'https://via.placeholder.com/300x200/F44336/white?text=Linha+3+Vermelha',
      lastUpdate: '20/08/2025',
      status: 'Em Andamento',
      progress: 51,
      progressColor: '#FFEB3B'
    },
    {
      id: 3,
      title: 'Expansão Linha 1 - Azul',
      subtitle: 'Estação Sé',
      image: 'https://via.placeholder.com/300x200/2196F3/white?text=Linha+1+Azul',
      lastUpdate: '20/08/2025',
      status: 'Em Andamento',
      progress: 13,
      progressColor: '#F44336'
    }
  ];

  const menuItems = [
    { icon: '🏠', label: 'Home', active: true, path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' },
    { icon: '👤', label: 'Usuário', path: '/profile' }
  ];

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <Layout menuItems={menuItems}>
        <header className="main-header">
          <h1>Home</h1>
          <div className="header-controls">
            <button className="theme-toggle">☀️</button>
            <button className="user-menu">👤</button>
            <button className="settings">⚙️</button>
          </div>
        </header>

        <div className="projects-grid">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="project-card"
              onClick={() => handleProjectClick(project.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="project-image">
                <img src={project.image} alt={project.title} />
              </div>
              <div className="project-content">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-subtitle">{project.subtitle}</p>
                
                <div className="project-info">
                  <div className="info-row">
                    <span className="info-label">Última Alteração:</span>
                    <span className="info-value">{project.lastUpdate}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className="info-value">{project.status}</span>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.progressColor
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">{project.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
    </Layout>
  );
}

export default Home;
