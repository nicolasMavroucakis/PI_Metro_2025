import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import reportService from '../services/reportService';
import '../Style/BimComparison.css';

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
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' }
  ];

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        const projectId = searchParams.get('projectId');
        
        const result = await reportService.getReportById(reportId, projectId);
        
        if (result.success) {
          console.log('📄 Relatório carregado:', result.report);
          console.log('🖼️ Imagens BIM:', result.report.bimImages);
          console.log('🏗️ Imagens Obra:', result.report.obraImages);
          console.log('📊 Analysis Result:', result.report.analysisResult);
          console.log('🔄 Pair Comparisons:', result.report.pairComparisons);
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
      case 'parcialmente_conforme':
        return '⚠️';
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
      case 'parcialmente_conforme':
        return 'Parcialmente Conforme';
      default:
        return 'Não Identificado';
    }
  };

  const handleBack = () => {
    navigate('/reports');
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
  const isPairAnalysis = report.isPairAnalysis || false;
  const totalPairs = report.totalPairs || 1;
  
  // Dados consolidados (compatível com formato antigo e novo)
  const consolidatedData = analysis;

  return (
    <Layout menuItems={menuItems}>
      <div className="bim-comparison-container">
        <header className="bim-comparison-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={handleBack}
            >
              ← Voltar
            </button>
            <h1>📄 Relatório de Análise BIM</h1>
            <span className={`status-badge ${report.status}`}>
              {report.status === 'success' ? '✅ Sucesso' : '❌ Falha'}
            </span>
          </div>
        </header>

        <main className="bim-comparison-main">
          {/* Resultados da Análise */}
          {report.status === 'success' && analysis ? (
            <section className="results-section">
              <h2>📊 Resultados da Análise</h2>
              
              {/* Informações do Relatório */}
              <div className="report-info-card">
                <div className="report-info-grid">
                  <div className="report-info-item">
                    <span className="info-label">ID do Relatório:</span>
                    <code className="info-value">{report.reportId}</code>
                  </div>
                  <div className="report-info-item">
                    <span className="info-label">Projeto:</span>
                    <span className="info-value">{report.projectName}</span>
                  </div>
                  <div className="report-info-item">
                    <span className="info-label">Usuário:</span>
                    <span className="info-value">{report.userName || 'Desconhecido'}</span>
                  </div>
                  <div className="report-info-item">
                    <span className="info-label">Data:</span>
                    <span className="info-value">{formatDate(report.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Contexto do Usuário */}
              {report.userContext && (
                <div className="context-info-card">
                  <h4>💬 Contexto Adicional</h4>
                  <p>{report.userContext}</p>
                </div>
              )}
              {isPairAnalysis && totalPairs > 1 && (
                <p className="analysis-type-badge">
                  🔄 Análise em Pares - {totalPairs} comparações realizadas
                </p>
              )}

              {/* Progresso Geral */}
              <div className="result-card progress-card">
                <div className="card-header">
                  <h3>📈 Progresso da Obra {isPairAnalysis && totalPairs > 1 && '(Consolidado)'}</h3>
                </div>
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
                        strokeDasharray={`${((consolidatedData.percentual_conclusao_geral || consolidatedData.percentual_conclusao || 0)) * 5.03} 503`}
                        transform="rotate(-90 100 100)"
                      />
                    </svg>
                    <div className="progress-text-large">
                      <span className="percentage">
                        {consolidatedData.percentual_conclusao_geral || consolidatedData.percentual_conclusao || 0}%
                      </span>
                      <span className="label">Concluído</span>
                    </div>
                  </div>
                  <div className="progress-description">
                    <p>{consolidatedData.analise_consolidada || consolidatedData.analise_progresso}</p>
                  </div>
                </div>
              </div>

              {/* Distribuição de Percentuais (só para múltiplos pares) */}
              {isPairAnalysis && totalPairs > 1 && consolidatedData.distribuicao_percentuais && (
                <div className="result-card distribution-card">
                  <div className="card-header">
                    <h3>📊 Distribuição dos Percentuais</h3>
                  </div>
                  <div className="distribution-grid">
                    <div className="distribution-item">
                      <strong>Mínimo</strong>
                      <p className="value">{consolidatedData.distribuicao_percentuais.minimo}%</p>
                    </div>
                    <div className="distribution-item">
                      <strong>Máximo</strong>
                      <p className="value">{consolidatedData.distribuicao_percentuais.maximo}%</p>
                    </div>
                    <div className="distribution-item">
                      <strong>Média</strong>
                      <p className="value">{consolidatedData.distribuicao_percentuais.media}%</p>
                    </div>
                    <div className="distribution-item">
                      <strong>Desvio</strong>
                      <p className="value">±{consolidatedData.distribuicao_percentuais.desvio_padrao?.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Conformidade */}
              {(consolidatedData.conformidade_geral || consolidatedData.conformidade) && (
                <div className="result-card conformity-card">
                  <div className="card-header">
                    <h3>✅ Análise de Conformidade {isPairAnalysis && totalPairs > 1 && '(Geral)'}</h3>
                  </div>
                  <div className="conformity-grid">
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.estrutura)}</span>
                      <div>
                        <strong>Estrutura</strong>
                        <p>{translateConformityStatus((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.estrutura)}</p>
                      </div>
                    </div>
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.dimensoes)}</span>
                      <div>
                        <strong>Dimensões</strong>
                        <p>{translateConformityStatus((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.dimensoes)}</p>
                      </div>
                    </div>
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.acabamento)}</span>
                      <div>
                        <strong>Acabamento</strong>
                        <p>{translateConformityStatus((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.acabamento)}</p>
                      </div>
                    </div>
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.posicionamento)}</span>
                      <div>
                        <strong>Posicionamento</strong>
                        <p>{translateConformityStatus((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.posicionamento)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Áreas Críticas (só para múltiplos pares) */}
              {isPairAnalysis && totalPairs > 1 && consolidatedData.areas_criticas && consolidatedData.areas_criticas.length > 0 && (
                <div className="result-card critical-areas-card">
                  <div className="card-header">
                    <h3>🚨 Áreas Críticas</h3>
                  </div>
                  <ul className="critical-areas-list">
                    {consolidatedData.areas_criticas.map((area, index) => (
                      <li key={index} className="critical-item">{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pontos Positivos (só para múltiplos pares) */}
              {isPairAnalysis && totalPairs > 1 && consolidatedData.pontos_positivos && consolidatedData.pontos_positivos.length > 0 && (
                <div className="result-card positive-points-card">
                  <div className="card-header">
                    <h3>✅ Pontos Positivos</h3>
                  </div>
                  <ul className="positive-points-list">
                    {consolidatedData.pontos_positivos.map((ponto, index) => (
                      <li key={index} className="positive-item">{ponto}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Problemas Detectados */}
              {(consolidatedData.problemas_consolidados || consolidatedData.problemas_detectados) && 
               (consolidatedData.problemas_consolidados || consolidatedData.problemas_detectados).length > 0 && (
                <div className="result-card problems-card">
                  <div className="card-header">
                    <h3>⚠️ Problemas e Anomalias Detectados</h3>
                  </div>
                  <div className="problems-list">
                    {(consolidatedData.problemas_consolidados || consolidatedData.problemas_detectados).map((problema, index) => (
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
                          {problema.frequencia && (
                            <p className="problem-frequency">
                              <small>📊 {problema.frequencia}</small>
                            </p>
                          )}
                          {problema.pares_afetados && (
                            <p className="problem-pairs">
                              <small>Pares afetados: {problema.pares_afetados.join(', ')}</small>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Elementos Faltantes */}
              {(consolidatedData.elementos_faltantes_consolidados || consolidatedData.elementos_faltantes) && 
               (consolidatedData.elementos_faltantes_consolidados || consolidatedData.elementos_faltantes).length > 0 && (
                <div className="result-card missing-elements-card">
                  <div className="card-header">
                    <h3>📋 Elementos Faltantes</h3>
                  </div>
                  <ul className="missing-elements-list">
                    {(consolidatedData.elementos_faltantes_consolidados || consolidatedData.elementos_faltantes).map((elemento, index) => (
                      <li key={index}>{elemento}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Observações Gerais */}
              {consolidatedData.observacoes_gerais && (
                <div className="result-card observations-card">
                  <div className="card-header">
                    <h3>📝 Observações Gerais</h3>
                  </div>
                  <div className="observations-content">
                    <p>{consolidatedData.observacoes_gerais}</p>
                  </div>
                </div>
              )}

              {/* Justificativa do Percentual */}
              {consolidatedData.justificativa_percentual && (
                <div className="result-card justification-card">
                  <div className="card-header">
                    <h3>📋 Justificativa do Percentual</h3>
                  </div>
                  <div className="justification-content">
                    <p style={{ fontStyle: 'italic' }}>{consolidatedData.justificativa_percentual}</p>
                  </div>
                </div>
              )}

              {/* Recomendações */}
              {((consolidatedData.recomendacoes_prioritarias && consolidatedData.recomendacoes_prioritarias.length > 0) ||
                (consolidatedData.recomendacoes && consolidatedData.recomendacoes.length > 0)) && (
                <div className="result-card recommendations-card">
                  <div className="card-header">
                    <h3>💡 Recomendações {isPairAnalysis && totalPairs > 1 && 'Prioritárias'}</h3>
                  </div>
                  {consolidatedData.recomendacoes_prioritarias ? (
                    <div className="priority-recommendations">
                      {consolidatedData.recomendacoes_prioritarias.map((rec, index) => (
                        <div key={index} className={`priority-rec priority-${rec.prioridade}`}>
                          <div className="rec-header">
                            <strong>[{rec.prioridade?.toUpperCase()}]</strong> {rec.acao}
                          </div>
                          <p className="rec-justification">{rec.justificativa}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="recommendations-list">
                      {consolidatedData.recomendacoes.map((recomendacao, index) => (
                        <li key={index}>{recomendacao}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Pares Analisados */}
              {isPairAnalysis && report.pairComparisons && report.pairComparisons.length > 0 && (
                <div className="result-card individual-analyses-card">
                  <div className="card-header">
                    <h3>🔄 Comparações por Par</h3>
                  </div>
                  <div className="individual-analyses-grid">
                    {report.pairComparisons.map((pair) => (
                      <div key={pair.pairIndex} className="individual-analysis-item pair-item">
                        <h4>Par {pair.pairIndex}</h4>
                        <div className="pair-files">
                          <div className="pair-file">
                            <span className="file-icon">📐</span>
                            <span className="file-name" title={pair.bimPhoto?.fileName || 'BIM'}>
                              {pair.bimPhoto?.fileName ? pair.bimPhoto.fileName.substring(0, 20) + '...' : 'BIM'}
                            </span>
                          </div>
                          <div className="pair-arrow">↔</div>
                          <div className="pair-file">
                            <span className="file-icon">🏗️</span>
                            <span className="file-name" title={pair.obraPhoto?.fileName || 'Obra'}>
                              {pair.obraPhoto?.fileName ? pair.obraPhoto.fileName.substring(0, 20) + '...' : 'Obra'}
                            </span>
                          </div>
                        </div>
                        {pair.analysis?.success && pair.analysis?.data ? (
                          <>
                            <div className="individual-score">
                              {pair.analysis.data.percentual_conclusao}%
                            </div>
                            <p className="individual-summary">
                              {pair.analysis.data.analise_progresso?.substring(0, 120)}...
                            </p>
                            <div className="individual-stats">
                              <span>⚠️ {pair.analysis.data.problemas_detectados?.length || 0} problemas</span>
                            </div>
                          </>
                        ) : (
                          <p className="error-message">❌ {pair.analysis?.error || 'Erro na análise'}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Imagens Analisadas */}
              <div className="result-card images-card">
                <div className="card-header">
                  <h3>🖼️ Imagens Analisadas ({totalPairs} Par{totalPairs > 1 ? 'es' : ''})</h3>
                </div>
                <div className="compared-images">
                  <div className="compared-image-item">
                    <h4>📐 Modelos BIM ({report.bimImages ? report.bimImages.length : (report.bimImage ? 1 : 0)})</h4>
                    <div className="multiple-images-preview">
                      {report.bimImages && Array.isArray(report.bimImages) && report.bimImages.length > 0 ? (
                        <>
                          {report.bimImages.slice(0, 4).map((photo, index) => (
                            <img 
                              key={index} 
                              src={photo.url} 
                              alt={`BIM ${index + 1}`} 
                              className="thumb"
                              onError={(e) => {
                                console.error('Erro ao carregar imagem BIM:', photo.url);
                                e.target.style.display = 'none';
                              }}
                            />
                          ))}
                          {report.bimImages.length > 4 && (
                            <div className="more-images">+{report.bimImages.length - 4}</div>
                          )}
                        </>
                      ) : report.bimImage && report.bimImage.url ? (
                        <img 
                          src={report.bimImage.url} 
                          alt="BIM" 
                          className="thumb"
                          onError={(e) => {
                            console.error('Erro ao carregar imagem BIM:', report.bimImage.url);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <p className="no-images-text">⚠️ Sem imagens BIM disponíveis</p>
                      )}
                    </div>
                  </div>
                  <div className="compared-image-item">
                    <h4>🏗️ Fotos da Obra ({report.obraImages ? report.obraImages.length : (report.obraImage ? 1 : 0)})</h4>
                    <div className="multiple-images-preview">
                      {report.obraImages && Array.isArray(report.obraImages) && report.obraImages.length > 0 ? (
                        <>
                          {report.obraImages.slice(0, 4).map((photo, index) => (
                            <img 
                              key={index} 
                              src={photo.url} 
                              alt={`Obra ${index + 1}`} 
                              className="thumb"
                              onError={(e) => {
                                console.error('Erro ao carregar imagem Obra:', photo.url);
                                e.target.style.display = 'none';
                              }}
                            />
                          ))}
                          {report.obraImages.length > 4 && (
                            <div className="more-images">+{report.obraImages.length - 4}</div>
                          )}
                        </>
                      ) : report.obraImage && report.obraImage.url ? (
                        <img 
                          src={report.obraImage.url} 
                          alt="Obra" 
                          className="thumb"
                          onError={(e) => {
                            console.error('Erro ao carregar imagem Obra:', report.obraImage.url);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <p className="no-images-text">⚠️ Sem fotos da obra disponíveis</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div className="error-message">
              <p>❌ Não foi possível carregar os resultados da análise</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}

export default ReportDetails;


