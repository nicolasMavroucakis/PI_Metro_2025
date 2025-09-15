import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import '../Style/ProjectDetails.css';

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // Mock data - em uma aplicação real, isso viria de uma API
  const projectData = {
    1: {
      title: 'Expansão Linha 2 - Verde Estação Vila Formosa',
      progress: 80,
      status: 'Em andamento',
      statusColor: '#4CAF50',
      lastCapture: '27/10/2025, 15:18',
      problems: 3,
      images: [
        'https://via.placeholder.com/120x90/4CAF50/white?text=Obra+1',
        'https://via.placeholder.com/120x90/4CAF50/white?text=Obra+2',
        'https://via.placeholder.com/120x90/4CAF50/white?text=Obra+3'
      ],
      nextSteps: [
        { task: 'Drenagem', startDate: '13/01/25', endDate: '25/02/25', status: 'active' },
        { task: 'Revestimento', startDate: '26/02/25', endDate: '20/04/25', status: 'pending' },
        { task: 'Concreto', startDate: '21/04/25', endDate: '31/05/25', status: 'pending' }
      ],
      observations: 'Detectada parede faltando no 2º andar. O progresso está 10% atrasado em relação ao cronograma planejado.',
      chartData: {
        executed: [0, 5, 15, 25, 40, 55, 80],
        planned: [0, 10, 25, 45, 65, 85, 100],
        months: ['Janeiro', 'Março', 'Maio', 'Julho', 'Setembro', 'Novembro']
      }
    },
    2: {
      title: 'Expansão Linha 3 - Vermelha Estação Tatuapé',
      progress: 51,
      status: 'Em andamento',
      statusColor: '#FFEB3B',
      lastCapture: '27/10/2025, 14:30',
      problems: 2,
      images: [
        'https://via.placeholder.com/120x90/F44336/white?text=Obra+1',
        'https://via.placeholder.com/120x90/F44336/white?text=Obra+2',
        'https://via.placeholder.com/120x90/F44336/white?text=Obra+3'
      ],
      nextSteps: [
        { task: 'Fundação', startDate: '15/01/25', endDate: '28/02/25', status: 'active' },
        { task: 'Estrutura', startDate: '01/03/25', endDate: '15/05/25', status: 'pending' },
        { task: 'Acabamento', startDate: '16/05/25', endDate: '30/06/25', status: 'pending' }
      ],
      observations: 'Projeto em andamento normal. Pequenos ajustes na estrutura principal.',
      chartData: {
        executed: [0, 8, 20, 30, 40, 48, 51],
        planned: [0, 15, 30, 50, 70, 85, 100],
        months: ['Janeiro', 'Março', 'Maio', 'Julho', 'Setembro', 'Novembro']
      }
    },
    3: {
      title: 'Expansão Linha 1 - Azul Estação Sé',
      progress: 13,
      status: 'Em andamento',
      statusColor: '#F44336',
      lastCapture: '27/10/2025, 16:45',
      problems: 5,
      images: [
        'https://via.placeholder.com/120x90/2196F3/white?text=Obra+1',
        'https://via.placeholder.com/120x90/2196F3/white?text=Obra+2',
        'https://via.placeholder.com/120x90/2196F3/white?text=Obra+3'
      ],
      nextSteps: [
        { task: 'Escavação', startDate: '10/01/25', endDate: '20/03/25', status: 'active' },
        { task: 'Drenagem', startDate: '21/03/25', endDate: '30/05/25', status: 'pending' },
        { task: 'Fundação', startDate: '01/06/25', endDate: '15/08/25', status: 'pending' }
      ],
      observations: 'Projeto em fase inicial. Aguardando liberações ambientais para acelerar o cronograma.',
      chartData: {
        executed: [0, 2, 5, 8, 10, 12, 13],
        planned: [0, 12, 28, 48, 68, 88, 100],
        months: ['Janeiro', 'Março', 'Maio', 'Julho', 'Setembro', 'Novembro']
      }
    }
  };

  const project = projectData[projectId] || projectData[1];

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

  return (
    <Layout menuItems={menuItems}>
      <header className="project-header">
        <h1>Projetos</h1>
      </header>
      
      <main className="project-details-main">
        <div className="project-title-section">
          <h2 className="project-main-title">{project.title}</h2>
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
                    stroke={project.statusColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${project.progress * 3.14} 314`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="progress-text">
                  <span className="progress-percentage">{project.progress}%</span>
                </div>
              </div>
              <p className="progress-status">{project.status}</p>
            </div>
          </div>

          {/* Últimas Capturas */}
          <div className="captures-card">
            <div className="card-header">
              <h3 className="card-title">Últimas Capturas</h3>
              <span className="camera-icon">📷</span>
            </div>
            <div className="captures-grid">
              {project.images.map((image, index) => (
                <div key={index} className="capture-item">
                  <img src={image} alt={`Captura ${index + 1}`} />
                </div>
              ))}
            </div>
            <p className="last-capture">Última Captura: {project.lastCapture}</p>
            <button className="view-more-btn" onClick={() => handleViewMore('capturas')}>
              Ver Mais
            </button>
          </div>

          {/* Alertas */}
          <div className="alerts-card">
            <div className="card-header">
              <h3 className="card-title">Alertas</h3>
              <span className="alert-icon">⚠️</span>
            </div>
            <div className="alert-number">
              <span className="alert-count">{project.problems}</span>
              <p className="alert-description">Problemas detectados</p>
            </div>
            <button className="view-more-btn" onClick={() => handleViewMore('alertas')}>
              Ver Mais
            </button>
          </div>

          {/* Próximas Etapas */}
          <div className="next-steps-card">
            <div className="card-header">
              <h3 className="card-title">Próximas Etapas</h3>
              <span className="calendar-icon">📅</span>
            </div>
            <div className="steps-list">
              {project.nextSteps.map((step, index) => (
                <div key={index} className={`step-item ${step.status}`}>
                  <div className="step-indicator"></div>
                  <div className="step-content">
                    <h4 className="step-title">{step.task}</h4>
                    <p className="step-dates">{step.startDate} - {step.endDate}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="view-more-btn" onClick={() => handleViewMore('etapas')}>
              Ver Mais
            </button>
          </div>
        </div>

        {/* Gráfico de Progresso */}
        <div className="chart-section">
          <div className="chart-header">
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot executed"></span>
                <span>Executado</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot planned"></span>
                <span>Planejado</span>
              </div>
            </div>
          </div>
          <div className="chart-container">
            <div className="chart-y-axis">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <div className="chart-area">
              <svg viewBox="0 0 600 200" className="progress-chart">
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="100" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 100 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="600" height="200" fill="url(#grid)" />
                
                {/* Planned line */}
                <polyline
                  fill="none"
                  stroke="#b3b3b3"
                  strokeWidth="3"
                  points="0,200 100,176 200,150 300,110 400,70 500,30 600,0"
                />
                
                {/* Executed line */}
                <polyline
                  fill="none"
                  stroke="#1976D2"
                  strokeWidth="3"
                  points="0,200 100,190 200,170 300,150 400,120 500,90 600,40"
                />
              </svg>
            </div>
            <div className="chart-x-axis">
              {project.chartData.months.map((month, index) => (
                <span key={index}>{month}</span>
              ))}
            </div>
          </div>
          <button className="generate-report-btn" onClick={handleGenerateReport}>
            Gerar Relatório
          </button>
        </div>

        {/* Observações */}
        <div className="observations-section">
          <h3>Observações</h3>
          <p>{project.observations}</p>
        </div>

        {/* Nova Captura */}
        <div className="new-capture-section">
          <button className="new-capture-btn" onClick={handleNewCapture}>
            Nova Captura
          </button>
        </div>
      </main>
    </Layout>
  );
}

export default ProjectDetails;

