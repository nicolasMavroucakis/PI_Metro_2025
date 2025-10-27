import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import reportService from '../services/reportService';
import '../Style/ReportDetails.css';

function ReportDetails() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' },
    { icon: '👤', label: 'Usuário', path: '/profile' }
  ];

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        const projectId = searchParams.get('projectId');
        
        const result = await reportService.getReportById(reportId, projectId);
        
        if (result.success) {
          setReport(result.report);
        } else {
          setError(result.message || 'Relatório não encontrado');
        }
      } catch (err) {
        console.error('Erro ao carregar relatório:', err);
        setError('Erro ao carregar relatório');
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      loadReport();
    }
  }, [reportId, searchParams]);

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

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'baixa':
        return '#4CAF50';
      case 'média':
      case 'media':
        return '#FF9800';
      case 'alta':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getConformityIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'conforme':
        return '✅';
      case 'não_conforme':
      case 'nao_conforme':
        return '❌';
      default:
        return '❓';
    }
  };

  const translateConformityStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'conforme':
        return 'Conforme';
      case 'não_conforme':
      case 'nao_conforme':
        return 'Não Conforme';
      default:
        return 'Não Identificado';
    }
  };

  const handleBack = () => {
    if (report && report.projectId) {
      navigate(`/reports?projectId=${report.projectId}`);
    } else {
      navigate('/reports');
    }
  };

  if (loading) {
    return (
      <Layout menuItems={menuItems}>
        <div className="report-details-loading">
          <p>Carregando relatório...</p>
        </div>
      </Layout>
    );
  }

  if (error || !report) {
    return (
      <Layout menuItems={menuItems}>
        <div className="report-details-error">
          <h2>❌ {error || 'Relatório não encontrado'}</h2>
          <button onClick={handleBack} className="btn-back">
            ← Voltar para Relatórios
          </button>
        </div>
      </Layout>
    );
  }

  const analysis = report.analysisResult;

  return (
    <Layout menuItems={menuItems}>
      <div className="report-details-container">
        <header className="report-details-header">
          <button onClick={handleBack} className="btn-back-header">
            ← Voltar
          </button>
          <div className="header-content">
            <h1>📄 Detalhes do Relatório</h1>
            <div className="report-meta">
              <span className={`status-badge ${report.status}`}>
                {report.status === 'success' ? '✅ Sucesso' : '❌ Falha'}
              </span>
              <span className="report-date">
                {formatDate(report.createdAt)}
              </span>
            </div>
          </div>
        </header>

        <main className="report-details-main">
          {/* Informações Básicas */}
          <div className="info-section">
            <div className="info-grid">
              <div className="info-item">
                <label>ID do Relatório:</label>
                <code>{report.reportId}</code>
              </div>
              <div className="info-item">
                <label>Projeto:</label>
                <span>{report.projectName}</span>
              </div>
              <div className="info-item">
                <label>Usuário:</label>
                <span>{report.userName}</span>
              </div>
              <div className="info-item">
                <label>Data:</label>
                <span>{formatDate(report.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Contexto do Usuário */}
          {report.userContext && (
            <div className="context-section">
              <h3>💬 Contexto Fornecido</h3>
              <p>{report.userContext}</p>
            </div>
          )}

          {/* Imagens Comparadas */}
          <div className="images-section">
            <h3>🖼️ Imagens Analisadas</h3>
            <div className="images-grid">
              <div className="image-card">
                <h4>📐 Modelo BIM</h4>
                <img src={report.bimImage.url} alt="BIM" />
                <p className="image-filename">{report.bimImage.fileName}</p>
              </div>
              <div className="image-card">
                <h4>🏗️ Foto da Obra</h4>
                <img src={report.obraImage.url} alt="Obra" />
                <p className="image-filename">{report.obraImage.fileName}</p>
              </div>
            </div>
          </div>

          {/* Resultados da Análise */}
          {report.status === 'success' && analysis ? (
            <>
              {/* Progresso */}
              <div className="progress-section">
                <h3>📈 Progresso da Obra</h3>
                <div className="progress-content">
                  <div className="progress-circle-large">
                    <svg viewBox="0 0 200 200">
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#e0e0e0"
                        strokeWidth="12"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill="none"
                        stroke="#1976D2"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(analysis.percentual_conclusao || 0) * 5.03} 503`}
                        transform="rotate(-90 100 100)"
                      />
                    </svg>
                    <div className="progress-text-large">
                      <span className="percentage">{analysis.percentual_conclusao || 0}%</span>
                      <span className="label">Concluído</span>
                    </div>
                  </div>
                  <div className="progress-description">
                    <p>{analysis.analise_progresso}</p>
                  </div>
                </div>
              </div>

              {/* Conformidade */}
              {analysis.conformidade && (
                <div className="conformity-section">
                  <h3>✅ Análise de Conformidade</h3>
                  <div className="conformity-grid">
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon(analysis.conformidade.estrutura)}</span>
                      <div>
                        <strong>Estrutura</strong>
                        <p>{translateConformityStatus(analysis.conformidade.estrutura)}</p>
                      </div>
                    </div>
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon(analysis.conformidade.dimensoes)}</span>
                      <div>
                        <strong>Dimensões</strong>
                        <p>{translateConformityStatus(analysis.conformidade.dimensoes)}</p>
                      </div>
                    </div>
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon(analysis.conformidade.acabamento)}</span>
                      <div>
                        <strong>Acabamento</strong>
                        <p>{translateConformityStatus(analysis.conformidade.acabamento)}</p>
                      </div>
                    </div>
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon(analysis.conformidade.posicionamento)}</span>
                      <div>
                        <strong>Posicionamento</strong>
                        <p>{translateConformityStatus(analysis.conformidade.posicionamento)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Problemas */}
              {analysis.problemas_detectados && analysis.problemas_detectados.length > 0 && (
                <div className="problems-section">
                  <h3>⚠️ Problemas Detectados</h3>
                  <div className="problems-list">
                    {analysis.problemas_detectados.map((problema, index) => (
                      <div key={index} className="problem-item">
                        <div
                          className="severity-indicator"
                          style={{ backgroundColor: getSeverityColor(problema.severidade) }}
                        />
                        <div className="problem-content">
                          <div className="problem-header">
                            <strong>{problema.tipo}</strong>
                            <span
                              className="severity-badge"
                              style={{ backgroundColor: getSeverityColor(problema.severidade) }}
                            >
                              {problema.severidade}
                            </span>
                          </div>
                          <p>{problema.descricao}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observações */}
              {analysis.observacoes_gerais && (
                <div className="observations-section">
                  <h3>📝 Observações Gerais</h3>
                  <p>{analysis.observacoes_gerais}</p>
                </div>
              )}

              {/* Recomendações */}
              {analysis.recomendacoes && analysis.recomendacoes.length > 0 && (
                <div className="recommendations-section">
                  <h3>💡 Recomendações</h3>
                  <ul className="recommendations-list">
                    {analysis.recomendacoes.map((recomendacao, index) => (
                      <li key={index}>{recomendacao}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            /* Mensagem de Erro */
            <div className="error-section">
              <h3>❌ Erro na Análise</h3>
              <p>{report.errorMessage || 'A análise não pôde ser concluída.'}</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}

export default ReportDetails;

