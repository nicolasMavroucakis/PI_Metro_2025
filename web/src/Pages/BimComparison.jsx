import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import projectService from '../services/projectService';
import vertexAIService from '../services/vertexAIService';
import reportService from '../services/reportService';
import '../Style/BimComparison.css';

function BimComparison() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Estados principais
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para fotos
  const [bimPhotos, setBimPhotos] = useState([]);
  const [obraPhotos, setObraPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Estados para seleção
  const [selectedBimPhoto, setSelectedBimPhoto] = useState(null);
  const [selectedObraPhoto, setSelectedObraPhoto] = useState(null);

  // Estados para comparação
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [userContext, setUserContext] = useState('');

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' }
  ];

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
        const projectData = await projectService.getProjectById(projectId);
        
        if (!projectData) {
          setError('Projeto não encontrado');
          setLoading(false);
          return;
        }

        setProject(projectData);
        await loadPhotos();
      } catch (err) {
        console.error('Erro ao carregar projeto:', err);
        setError('Erro ao carregar dados do projeto');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId]);

  // Carregar fotos do projeto
  const loadPhotos = async () => {
    try {
      setLoadingPhotos(true);

      // Carregar fotos do BIM (categoria2)
      const bimPhotosData = await projectService.getProjectPhotosById(projectId, 'categoria2', 50);
      setBimPhotos(bimPhotosData);

      // Carregar fotos da obra (categoria1)
      const obraPhotosData = await projectService.getProjectPhotosById(projectId, 'categoria1', 50);
      setObraPhotos(obraPhotosData);

    } catch (err) {
      console.error('Erro ao carregar fotos:', err);
      setError('Erro ao carregar fotos do projeto');
    } finally {
      setLoadingPhotos(false);
    }
  };

  // Realizar comparação
  const handleCompare = async () => {
    if (!selectedBimPhoto || !selectedObraPhoto) {
      alert('Por favor, selecione uma foto do BIM e uma foto da obra para comparar.');
      return;
    }

    if (!vertexAIService.isConfigured()) {
      alert('A API do Google não está configurada. Por favor, configure a chave de API no arquivo .env');
      return;
    }

    try {
      setComparing(true);
      setComparisonResult(null);
      setShowResults(false);

      const result = await vertexAIService.compareImages(
        selectedBimPhoto.url,
        selectedObraPhoto.url,
        userContext
      );

      console.log('Resultado da comparação:', result);

      if (result.success) {
        console.log('Dados da análise:', result.data);
        setComparisonResult(result.data);
        setShowResults(true);
        
        // 🆕 Salvar relatório no DynamoDB
        try {
          const saveResult = await reportService.saveReport({
            projectId: projectId,
            projectName: project.projectName,
            status: 'success',
            bimImage: {
              url: selectedBimPhoto.url,
              fileName: selectedBimPhoto.fileName,
              category: 'categoria2'
            },
            obraImage: {
              url: selectedObraPhoto.url,
              fileName: selectedObraPhoto.fileName,
              category: 'categoria1'
            },
            userContext: userContext,
            analysisResult: result.data,
            userId: localStorage.getItem('userId') || 'guest',
            userName: localStorage.getItem('userName') || 'Usuário'
          });
          
          if (saveResult.success) {
            console.log('✅ Relatório salvo:', saveResult.reportId);
          } else {
            console.warn('⚠️ Erro ao salvar relatório:', saveResult.error);
          }
        } catch (saveError) {
          console.error('❌ Erro ao salvar relatório:', saveError);
          // Não bloqueia a exibição dos resultados se falhar ao salvar
        }
      } else {
        alert(`Erro na comparação: ${result.error}`);
        
        // Salvar relatório de falha
        try {
          await reportService.saveReport({
            projectId: projectId,
            projectName: project.projectName,
            status: 'failed',
            bimImage: {
              url: selectedBimPhoto.url,
              fileName: selectedBimPhoto.fileName,
              category: 'categoria2'
            },
            obraImage: {
              url: selectedObraPhoto.url,
              fileName: selectedObraPhoto.fileName,
              category: 'categoria1'
            },
            userContext: userContext,
            errorMessage: result.error,
            userId: localStorage.getItem('userId') || 'guest',
            userName: localStorage.getItem('userName') || 'Usuário'
          });
        } catch (saveError) {
          console.error('❌ Erro ao salvar relatório de falha:', saveError);
        }
      }
    } catch (err) {
      console.error('Erro ao comparar imagens:', err);
      alert('Erro ao realizar comparação. Tente novamente.');
    } finally {
      setComparing(false);
    }
  };

  // Resetar seleções
  const handleReset = () => {
    setSelectedBimPhoto(null);
    setSelectedObraPhoto(null);
    setComparisonResult(null);
    setShowResults(false);
    setUserContext('');
  };

  // Obter cor da severidade
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

  // Obter ícone de conformidade
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

  // Traduzir status de conformidade
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

  if (loading) {
    return (
      <Layout menuItems={menuItems}>
        <div className="bim-comparison-loading">
          <p>Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout menuItems={menuItems}>
        <div className="bim-comparison-error">
          <p>{error}</p>
          <button onClick={() => navigate(`/project/${projectId}`)}>
            Voltar ao Projeto
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout menuItems={menuItems}>
      <div className="bim-comparison-container">
        <header className="bim-comparison-header">
          <div className="header-content">
            <button 
              className="back-button"
              onClick={() => navigate(`/project/${projectId}`)}
            >
              ← Voltar
            </button>
            <h1>🔍 Comparação BIM com IA</h1>
            <p className="subtitle">{project?.projectName}</p>
          </div>
        </header>

        <main className="bim-comparison-main">
          {/* Seção de Seleção de Fotos */}
          <section className="selection-section">
            <h2>Selecione as Imagens para Comparar</h2>
            
            <div className="selection-grid">
              {/* Seleção de Foto do BIM */}
              <div className="selection-column">
                <h3>📐 Foto do Modelo BIM</h3>
                {loadingPhotos ? (
                  <p>Carregando fotos...</p>
                ) : bimPhotos.length === 0 ? (
                  <div className="no-photos">
                    <p>Nenhuma foto do BIM disponível</p>
                    <p className="hint">Adicione fotos do BIM no projeto primeiro</p>
                  </div>
                ) : (
                  <>
                    <div className="photo-grid">
                      {bimPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className={`photo-item ${selectedBimPhoto?.url === photo.url ? 'selected' : ''}`}
                          onClick={() => setSelectedBimPhoto(photo)}
                        >
                          <img src={photo.url} alt={photo.fileName} />
                          <div className="photo-overlay">
                            {selectedBimPhoto?.url === photo.url && <span className="check-icon">✓</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedBimPhoto && (
                      <div className="selected-photo-info">
                        ✓ Selecionada: {selectedBimPhoto.fileName}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Seleção de Foto da Obra */}
              <div className="selection-column">
                <h3>🏗️ Foto da Obra Real</h3>
                {loadingPhotos ? (
                  <p>Carregando fotos...</p>
                ) : obraPhotos.length === 0 ? (
                  <div className="no-photos">
                    <p>Nenhuma foto da obra disponível</p>
                    <p className="hint">Adicione fotos da obra no projeto primeiro</p>
                  </div>
                ) : (
                  <>
                    <div className="photo-grid">
                      {obraPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className={`photo-item ${selectedObraPhoto?.url === photo.url ? 'selected' : ''}`}
                          onClick={() => setSelectedObraPhoto(photo)}
                        >
                          <img src={photo.url} alt={photo.fileName} />
                          <div className="photo-overlay">
                            {selectedObraPhoto?.url === photo.url && <span className="check-icon">✓</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedObraPhoto && (
                      <div className="selected-photo-info">
                        ✓ Selecionada: {selectedObraPhoto.fileName}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Campo de Contexto Adicional */}
            <div className="context-section">
              <h3>💬 Informações Adicionais (Opcional)</h3>
              <p className="context-hint">
                Forneça detalhes adicionais sobre a obra que podem ajudar na análise (ex: problemas conhecidos, materiais específicos, etapa da construção, etc.)
              </p>
              <textarea
                className="context-input"
                placeholder="Exemplo: Esta é a área de entrada principal. O teto ainda não foi instalado conforme cronograma. Estamos usando vigas de aço A36..."
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <div className="character-count">
                {userContext.length}/500 caracteres
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="action-buttons">
              <button
                className="btn-compare"
                onClick={handleCompare}
                disabled={!selectedBimPhoto || !selectedObraPhoto || comparing}
              >
                {comparing ? '🔄 Analisando...' : '🚀 Comparar com IA'}
              </button>
              <button
                className="btn-reset"
                onClick={handleReset}
                disabled={comparing}
              >
                🔄 Resetar
              </button>
            </div>
          </section>

          {/* Seção de Resultados */}
          {showResults && comparisonResult && (
            <section className="results-section">
              <h2>📊 Resultados da Análise</h2>

              {/* Progresso */}
              <div className="result-card progress-card">
                <div className="card-header">
                  <h3>📈 Progresso da Obra</h3>
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
                        strokeDasharray={`${(comparisonResult.percentual_conclusao || 0) * 5.03} 503`}
                        transform="rotate(-90 100 100)"
                      />
                    </svg>
                    <div className="progress-text-large">
                      <span className="percentage">{comparisonResult.percentual_conclusao || 0}%</span>
                      <span className="label">Concluído</span>
                    </div>
                  </div>
                  <div className="progress-description">
                    <p>{comparisonResult.analise_progresso}</p>
                  </div>
                </div>
              </div>

              {/* Conformidade */}
              <div className="result-card conformity-card">
                <div className="card-header">
                  <h3>✅ Análise de Conformidade</h3>
                </div>
                <div className="conformity-grid">
                  <div className="conformity-item">
                    <span className="conformity-icon">{getConformityIcon(comparisonResult.conformidade?.estrutura)}</span>
                    <div>
                      <strong>Estrutura</strong>
                      <p>{translateConformityStatus(comparisonResult.conformidade?.estrutura)}</p>
                    </div>
                  </div>
                  <div className="conformity-item">
                    <span className="conformity-icon">{getConformityIcon(comparisonResult.conformidade?.dimensoes)}</span>
                    <div>
                      <strong>Dimensões</strong>
                      <p>{translateConformityStatus(comparisonResult.conformidade?.dimensoes)}</p>
                    </div>
                  </div>
                  <div className="conformity-item">
                    <span className="conformity-icon">{getConformityIcon(comparisonResult.conformidade?.acabamento)}</span>
                    <div>
                      <strong>Acabamento</strong>
                      <p>{translateConformityStatus(comparisonResult.conformidade?.acabamento)}</p>
                    </div>
                  </div>
                  <div className="conformity-item">
                    <span className="conformity-icon">{getConformityIcon(comparisonResult.conformidade?.posicionamento)}</span>
                    <div>
                      <strong>Posicionamento</strong>
                      <p>{translateConformityStatus(comparisonResult.conformidade?.posicionamento)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problemas Detectados */}
              {comparisonResult.problemas_detectados && comparisonResult.problemas_detectados.length > 0 && (
                <div className="result-card problems-card">
                  <div className="card-header">
                    <h3>⚠️ Problemas e Anomalias Detectados</h3>
                  </div>
                  <div className="problems-list">
                    {comparisonResult.problemas_detectados.map((problema, index) => (
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

              {/* Observações Gerais */}
              {comparisonResult.observacoes_gerais && (
                <div className="result-card observations-card">
                  <div className="card-header">
                    <h3>📝 Observações Gerais</h3>
                  </div>
                  <div className="observations-content">
                    <p>{comparisonResult.observacoes_gerais}</p>
                  </div>
                </div>
              )}

              {/* Recomendações */}
              {comparisonResult.recomendacoes && comparisonResult.recomendacoes.length > 0 && (
                <div className="result-card recommendations-card">
                  <div className="card-header">
                    <h3>💡 Recomendações</h3>
                  </div>
                  <ul className="recommendations-list">
                    {comparisonResult.recomendacoes.map((recomendacao, index) => (
                      <li key={index}>{recomendacao}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Imagens Comparadas */}
              <div className="result-card images-card">
                <div className="card-header">
                  <h3>🖼️ Imagens Analisadas</h3>
                </div>
                <div className="compared-images">
                  <div className="compared-image-item">
                    <h4>📐 Modelo BIM</h4>
                    <img src={selectedBimPhoto.url} alt="BIM" />
                  </div>
                  <div className="compared-image-item">
                    <h4>🏗️ Foto da Obra</h4>
                    <img src={selectedObraPhoto.url} alt="Obra" />
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </Layout>
  );
}

export default BimComparison;

