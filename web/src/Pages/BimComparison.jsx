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

  // Estados para seleção (múltiplas para ambos)
  const [selectedBimPhotos, setSelectedBimPhotos] = useState([]); // Array para múltiplas fotos BIM
  const [selectedObraPhotos, setSelectedObraPhotos] = useState([]); // Array para múltiplas fotos Obra

  // Estados para comparação
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [userContext, setUserContext] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '', phase: '' });

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

  // Toggle seleção de foto BIM (permite múltiplas)
  const toggleBimPhotoSelection = (photo) => {
    setSelectedBimPhotos(prev => {
      const isSelected = prev.some(p => p.url === photo.url);
      if (isSelected) {
        return prev.filter(p => p.url !== photo.url);
      } else {
        return [...prev, photo];
      }
    });
  };

  // Verificar se foto BIM está selecionada
  const isBimPhotoSelected = (photo) => {
    return selectedBimPhotos.some(p => p.url === photo.url);
  };

  // Toggle seleção de foto da obra (permite múltiplas)
  const toggleObraPhotoSelection = (photo) => {
    setSelectedObraPhotos(prev => {
      const isSelected = prev.some(p => p.url === photo.url);
      if (isSelected) {
        return prev.filter(p => p.url !== photo.url);
      } else {
        return [...prev, photo];
      }
    });
  };

  // Verificar se foto Obra está selecionada
  const isObraPhotoSelected = (photo) => {
    return selectedObraPhotos.some(p => p.url === photo.url);
  };

  // Realizar comparação em pares
  const handleCompare = async () => {
    if (selectedBimPhotos.length === 0 || selectedObraPhotos.length === 0) {
      alert('Por favor, selecione pelo menos uma foto do BIM e uma foto da obra para comparar.');
      return;
    }

    // Verificar se a quantidade é diferente e avisar
    if (selectedBimPhotos.length !== selectedObraPhotos.length) {
      const minCount = Math.min(selectedBimPhotos.length, selectedObraPhotos.length);
      const confirmed = window.confirm(
        `Você selecionou ${selectedBimPhotos.length} foto(s) BIM e ${selectedObraPhotos.length} foto(s) da obra.\n\n` +
        `Serão comparados ${minCount} pares.\n` +
        `As fotos extras serão ignoradas.\n\n` +
        `Deseja continuar?`
      );
      if (!confirmed) return;
    }

    if (!vertexAIService.isConfigured()) {
      alert('A API do Google não está configurada. Por favor, configure a chave de API no arquivo .env');
      return;
    }

    try {
      setComparing(true);
      setComparisonResult(null);
      setShowResults(false);
      setProgress({ current: 0, total: 0, message: 'Iniciando comparações em pares...', phase: '' });

      // Determinar quantos pares serão comparados
      const totalPairs = Math.min(selectedBimPhotos.length, selectedObraPhotos.length);
      const pairComparisons = [];

      // Fazer comparações em pares
      for (let i = 0; i < totalPairs; i++) {
        const bimPhoto = selectedBimPhotos[i];
        const obraPhoto = selectedObraPhotos[i];

        console.log(`Comparando par ${i + 1}/${totalPairs}...`);
        
        setProgress({
          current: i + 1,
          total: totalPairs,
          phase: 'pairs',
          message: `Comparando par ${i + 1} de ${totalPairs}: BIM ${i + 1} ↔ Obra ${i + 1}`
        });

        try {
          const result = await vertexAIService.compareImages(
            bimPhoto.url,
            obraPhoto.url,
            `${userContext}\n\nPar ${i + 1}: Comparando "${bimPhoto.fileName}" com "${obraPhoto.fileName}"`
          );

          console.log(`📊 RESULTADO DO PAR ${i + 1}:`, JSON.stringify(result, null, 2));

          if (result.success) {
            // Verificar se é análise parcial
            if (result.isPartial) {
              console.warn(`⚠️ Par ${i + 1} retornou análise parcial (MAX_TOKENS)`);
            }
            
            pairComparisons.push({
              pairIndex: i + 1,
              bimPhoto: {
                url: bimPhoto.url,
                fileName: bimPhoto.fileName
              },
              obraPhoto: {
                url: obraPhoto.url,
                fileName: obraPhoto.fileName
              },
              analysis: result
            });
          } else {
            throw new Error(result.error || 'Erro desconhecido');
          }

        } catch (pairError) {
          console.error(`❌ Erro no par ${i + 1}:`, pairError);
          
          // Verificar se é erro de MAX_TOKENS
          const isMaxTokensError = pairError.message?.includes('MAX_TOKENS') || 
                                    pairError.message?.includes('limite de tokens');
          
          let errorMessage = pairError.message || 'Erro ao comparar este par';
          if (isMaxTokensError) {
            errorMessage = 'Análise muito detalhada. Tentando análise parcial...';
            console.warn(`⚠️ Par ${i + 1} excedeu limite - análise parcial será usada`);
          }
          
          // Adicionar como erro (mas comparação continuará)
          pairComparisons.push({
            pairIndex: i + 1,
            bimPhoto: {
              url: bimPhoto.url,
              fileName: bimPhoto.fileName
            },
            obraPhoto: {
              url: obraPhoto.url,
              fileName: obraPhoto.fileName
            },
            analysis: {
              success: false,
              error: errorMessage,
              isMaxTokensError: isMaxTokensError
            }
          });
        }

        // Delay entre comparações (2s para evitar rate limiting)
        if (i < totalPairs - 1) {
          console.log('⏳ Aguardando 2s antes da próxima comparação...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Consolidar todas as comparações
      setProgress({
        current: totalPairs,
        total: totalPairs,
        phase: 'consolidation',
        message: 'Consolidando todas as comparações...'
      });

      const consolidatedResult = await consolidatePairComparisons(pairComparisons, userContext);

      console.log('🎯 RESULTADO DA CONSOLIDAÇÃO:', JSON.stringify(consolidatedResult, null, 2));

      const result = {
        success: true,
        totalPairs: totalPairs,
        pairComparisons: pairComparisons,
        consolidatedAnalysis: consolidatedResult,
        timestamp: new Date().toISOString()
      };

      console.log('📦 RESULTADO FINAL COMPLETO:', JSON.stringify(result, null, 2));
      console.log('Resultado consolidado:', result);
      setComparisonResult(result);
      setShowResults(true);

      // Salvar relatório no DynamoDB
      try {
        const analysisData = consolidatedResult.data;
        
        const bimImagesArray = selectedBimPhotos.slice(0, totalPairs).map(photo => ({
          url: photo.url,
          fileName: photo.fileName,
          category: 'categoria2'
        }));
        
        const obraImagesArray = selectedObraPhotos.slice(0, totalPairs).map(photo => ({
          url: photo.url,
          fileName: photo.fileName,
          category: 'categoria1'
        }));
        
        console.log('💾 Salvando relatório...');
        console.log('🖼️ BIM Images a salvar:', bimImagesArray);
        console.log('🏗️ Obra Images a salvar:', obraImagesArray);
        console.log('📊 Analysis Data:', analysisData);
        console.log('🔄 Pair Comparisons:', pairComparisons);
        
        const reportData = {
          projectId: projectId,
          projectName: project.projectName,
          status: 'success',
          bimImages: bimImagesArray,
          obraImages: obraImagesArray,
          userContext: userContext,
          analysisResult: analysisData,
          pairComparisons: pairComparisons,
          isPairAnalysis: true,
          totalPairs: totalPairs,
          userId: localStorage.getItem('userId') || 'guest',
          userName: localStorage.getItem('userName') || 'Usuário'
        };
        
        console.log('📦 Dados completos do relatório a salvar:', reportData);
        
        const saveResult = await reportService.saveReport(reportData);
        
        if (saveResult.success) {
          console.log('✅ Relatório salvo com sucesso:', saveResult.reportId);
        } else {
          console.warn('⚠️ Erro ao salvar relatório:', saveResult.error);
        }
      } catch (saveError) {
        console.error('❌ Erro ao salvar relatório:', saveError);
      }

    } catch (err) {
      console.error('Erro ao comparar imagens:', err);
      alert('Erro ao realizar comparações. Tente novamente.');
    } finally {
      setComparing(false);
      setProgress({ current: 0, total: 0, message: '', phase: '' });
    }
  };

  // Consolidar comparações de pares
  const consolidatePairComparisons = async (pairComparisons, userContext) => {
    try {
      console.log('🔄 INICIANDO CONSOLIDAÇÃO DE PARES...');
      console.log('📊 PARES RECEBIDOS:', JSON.stringify(pairComparisons, null, 2));
      
      // Preparar resumo das comparações
      const pairSummaries = pairComparisons.map((pair) => {
        if (!pair.analysis.success) {
          return `PAR ${pair.pairIndex}: Erro na análise - ${pair.analysis.error}`;
        }

        const data = pair.analysis.data;
        return `
PAR ${pair.pairIndex}:
- BIM: ${pair.bimPhoto.fileName}
- Obra: ${pair.obraPhoto.fileName}
- Percentual: ${data.percentual_conclusao}%
- Análise: ${data.analise_progresso}
- Problemas: ${data.problemas_detectados?.length || 0}
- Conformidade: ${data.conformidade?.estrutura || 'não_identificado'}
`;
      }).join('\n---\n');

      // Prompt para consolidação de pares
      const prompt = `Você é um engenheiro civil especialista. Você recebeu análises de ${pairComparisons.length} comparações PAREADAS entre modelos BIM e fotos da obra.

Cada PAR compara UMA foto BIM específica com UMA foto da obra correspondente.

Sua tarefa é CONSOLIDAR todas essas comparações pareadas em um RELATÓRIO ÚNICO.${userContext ? `\n\nCONTEXTO: ${userContext}` : ''}

COMPARAÇÕES PAREADAS:
${pairSummaries}

Consolide e retorne APENAS JSON no formato:
{
  "percentual_conclusao_geral": <média dos percentuais>,
  "analise_consolidada": "<síntese de todos os pares>",
  "distribuicao_percentuais": {
    "minimo": <menor %>,
    "maximo": <maior %>,
    "media": <média>,
    "desvio_padrao": <desvio>
  },
  "problemas_consolidados": [
    {
      "tipo": "<tipo>",
      "descricao": "<descrição>",
      "severidade": "<baixa|média|alta>",
      "pares_afetados": [<índices dos pares>]
    }
  ],
  "conformidade_geral": {
    "estrutura": "<conforme|parcialmente_conforme|não_conforme>",
    "dimensoes": "<conforme|parcialmente_conforme|não_conforme>",
    "acabamento": "<conforme|parcialmente_conforme|não_conforme>",
    "posicionamento": "<conforme|parcialmente_conforme|não_conforme>"
  },
  "areas_criticas": ["<áreas problemáticas>"],
  "pontos_positivos": ["<aspectos bem executados>"],
  "observacoes_gerais": "<síntese geral>",
  "recomendacoes_prioritarias": [
    {
      "prioridade": "<alta|média|baixa>",
      "acao": "<descrição>",
      "justificativa": "<por que>"
    }
  ]
}`;

      console.log('🚀 ENVIANDO REQUISIÇÃO DE CONSOLIDAÇÃO...');
      console.log('📝 PROMPT DE CONSOLIDAÇÃO (primeiros 1000 chars):', prompt.substring(0, 1000));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,  // Aumentado para evitar truncamento
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na API do Gemini (consolidação):', errorData);
        throw new Error('Erro na consolidação');
      }

      const data = await response.json();
      
      console.log('📦 RESPOSTA DA API DE CONSOLIDAÇÃO:', JSON.stringify(data, null, 2));
      
      // Validar estrutura da resposta
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Nenhuma resposta foi gerada pela IA na consolidação');
      }

      if (!data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error('Estrutura de resposta inválida na consolidação:', data);
        throw new Error('Resposta da IA com estrutura inválida');
      }

      const textResponse = data.candidates[0].content.parts[0].text;

      console.log('📝 TEXTO DA RESPOSTA DE CONSOLIDAÇÃO (primeiros 500 chars):', textResponse.substring(0, 500));

      // Parse e limpeza
      let cleanedText = textResponse.trim()
        .replace(/^```json\s*/gmi, '')
        .replace(/^```\s*/gm, '')
        .replace(/```\s*$/gm, '');

      const jsonStartIndex = cleanedText.indexOf('{');
      if (jsonStartIndex > 0) cleanedText = cleanedText.substring(jsonStartIndex);

      const jsonEndIndex = cleanedText.lastIndexOf('}');
      if (jsonEndIndex > 0 && jsonEndIndex < cleanedText.length - 1) {
        cleanedText = cleanedText.substring(0, jsonEndIndex + 1);
      }

      console.log('🧹 TEXTO CONSOLIDADO LIMPO (primeiros 500 chars):', cleanedText.substring(0, 500));

      const consolidatedResult = JSON.parse(cleanedText.trim());

      console.log('✅ CONSOLIDAÇÃO PARSEADA COM SUCESSO!');
      console.log('📊 RESULTADO CONSOLIDADO PARSEADO:', JSON.stringify(consolidatedResult, null, 2));

      return {
        success: true,
        data: consolidatedResult,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ ERRO NA CONSOLIDAÇÃO:', error);
      console.error('🔍 DETALHES DO ERRO:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      // Fallback: consolidação manual
      console.log('🔄 USANDO CONSOLIDAÇÃO MANUAL (FALLBACK)');
      const validPairs = pairComparisons.filter(p => p.analysis.success);
      const percentuais = validPairs.map(p => p.analysis.data.percentual_conclusao);
      const media = percentuais.length > 0 
        ? Math.round(percentuais.reduce((sum, p) => sum + p, 0) / percentuais.length)
        : 0;

      return {
        success: true,
        data: {
          percentual_conclusao_geral: media,
          analise_consolidada: `Análise baseada em ${pairComparisons.length} pares de comparação.`,
          distribuicao_percentuais: {
            minimo: Math.min(...percentuais),
            maximo: Math.max(...percentuais),
            media: media,
            desvio_padrao: 0
          },
          observacoes_gerais: 'Consolidação automática. Veja análises individuais dos pares.'
        },
        timestamp: new Date().toISOString()
      };
    }
  };

  // Resetar seleções
  const handleReset = () => {
    setSelectedBimPhotos([]);
    setSelectedObraPhotos([]);
    setComparisonResult(null);
    setShowResults(false);
    setUserContext('');
    setProgress({ current: 0, total: 0, message: '', phase: '' });
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
              {/* Seleção de Fotos do BIM (Múltiplas) */}
              <div className="selection-column">
                <h3>📐 Fotos do Modelo BIM (Múltiplas)</h3>
                <p className="multi-select-hint">
                  💡 Clique para selecionar/desselecionar múltiplas fotos
                </p>
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
                          className={`photo-item ${isBimPhotoSelected(photo) ? 'selected' : ''}`}
                          onClick={() => toggleBimPhotoSelection(photo)}
                        >
                          <img src={photo.url} alt={photo.fileName} />
                          <div className="photo-overlay">
                            {isBimPhotoSelected(photo) && <span className="check-icon">✓</span>}
                          </div>
                          {isBimPhotoSelected(photo) && (
                            <div className="photo-number">
                              {selectedBimPhotos.findIndex(p => p.url === photo.url) + 1}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {selectedBimPhotos.length > 0 && (
                      <div className="selected-photo-info">
                        ✓ {selectedBimPhotos.length} foto(s) BIM selecionada(s)
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Seleção de Fotos da Obra (Múltiplas) */}
              <div className="selection-column">
                <h3>🏗️ Fotos da Obra Real (Múltiplas)</h3>
                <p className="multi-select-hint">
                  💡 Clique para selecionar/desselecionar múltiplas fotos
                </p>
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
                          className={`photo-item ${isObraPhotoSelected(photo) ? 'selected' : ''}`}
                          onClick={() => toggleObraPhotoSelection(photo)}
                        >
                          <img src={photo.url} alt={photo.fileName} />
                          <div className="photo-overlay">
                            {isObraPhotoSelected(photo) && <span className="check-icon">✓</span>}
                          </div>
                          {isObraPhotoSelected(photo) && (
                            <div className="photo-number">
                              {selectedObraPhotos.findIndex(p => p.url === photo.url) + 1}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {selectedObraPhotos.length > 0 && (
                      <div className="selected-photo-info">
                        ✓ {selectedObraPhotos.length} foto(s) selecionada(s)
                        {selectedObraPhotos.length > 1 && (
                          <span style={{ marginLeft: '10px', color: '#4CAF50', fontWeight: 'bold' }}>
                            (Análise Múltipla)
                          </span>
                        )}
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
                disabled={selectedBimPhotos.length === 0 || selectedObraPhotos.length === 0 || comparing}
              >
                {comparing ? '🔄 Analisando...' : 
                 selectedBimPhotos.length > 0 && selectedObraPhotos.length > 0 
                   ? `🚀 Comparar ${Math.min(selectedBimPhotos.length, selectedObraPhotos.length)} Par(es)` 
                   : '🚀 Comparar com IA'}
              </button>
              <button
                className="btn-reset"
                onClick={handleReset}
                disabled={comparing}
              >
                🔄 Resetar
              </button>
            </div>

            {/* Info de Pares */}
            {selectedBimPhotos.length > 0 && selectedObraPhotos.length > 0 && !comparing && (
              <div className="pairs-info">
                {selectedBimPhotos.length === selectedObraPhotos.length ? (
                  <p className="info-message success">
                    ✅ {selectedBimPhotos.length} par(es) será(ão) comparado(s)
                  </p>
                ) : (
                  <p className="info-message warning">
                    ⚠️ Você selecionou {selectedBimPhotos.length} BIM e {selectedObraPhotos.length} Obra. 
                    Serão comparados {Math.min(selectedBimPhotos.length, selectedObraPhotos.length)} pares.
                  </p>
                )}
              </div>
            )}

            {/* Barra de Progresso */}
            {comparing && progress.total > 0 && (
              <div className="progress-section">
                <h3>
                  {progress.phase === 'pairs' ? '📸 Comparando Pares' : '🔄 Consolidando Comparações'}
                </h3>
                <p className="progress-message">{progress.message}</p>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <p className="progress-stats">
                  {progress.current} de {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
                </p>
              </div>
            )}
          </section>

          {/* Seção de Resultados */}
          {showResults && comparisonResult && (() => {
            // Determinar se é análise em pares
            const isPairAnalysis = comparisonResult.totalPairs >= 1;
            const consolidatedData = comparisonResult.consolidatedAnalysis?.data || comparisonResult.data || comparisonResult;
            
            return (
              <section className="results-section">
                <h2>📊 Resultados da Análise</h2>
                {isPairAnalysis && comparisonResult.totalPairs > 1 && (
                  <p className="analysis-type-badge">
                    🔄 Análise em Pares - {comparisonResult.totalPairs} comparações realizadas
                  </p>
                )}

                {/* Progresso Geral */}
                <div className="result-card progress-card">
                  <div className="card-header">
                    <h3>📈 Progresso da Obra {isPairAnalysis && comparisonResult.totalPairs > 1 && '(Consolidado)'}</h3>
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
                {isPairAnalysis && comparisonResult.totalPairs > 1 && consolidatedData.distribuicao_percentuais && (
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
                <div className="result-card conformity-card">
                  <div className="card-header">
                    <h3>✅ Análise de Conformidade {isPairAnalysis && comparisonResult.totalPairs > 1 && '(Geral)'}</h3>
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

                {/* Áreas Críticas (só para múltiplos pares) */}
                {isPairAnalysis && comparisonResult.totalPairs > 1 && consolidatedData.areas_criticas && consolidatedData.areas_criticas.length > 0 && (
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
                {isPairAnalysis && comparisonResult.totalPairs > 1 && consolidatedData.pontos_positivos && consolidatedData.pontos_positivos.length > 0 && (
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
                          </div>
                        </div>
                      ))}
                    </div>
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

                {/* Justificativa do Percentual (novo campo) */}
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
                      <h3>💡 Recomendações {isPairAnalysis && comparisonResult.totalPairs > 1 && 'Prioritárias'}</h3>
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
                {isPairAnalysis && comparisonResult.pairComparisons && (
                  <div className="result-card individual-analyses-card">
                    <div className="card-header">
                      <h3>🔄 Comparações por Par</h3>
                    </div>
                    <div className="individual-analyses-grid">
                      {comparisonResult.pairComparisons.map((pair) => (
                        <div key={pair.pairIndex} className="individual-analysis-item pair-item">
                          <h4>
                            Par {pair.pairIndex}
                            {pair.analysis.isPartial && (
                              <span className="partial-badge" title="Análise resumida devido a limitação de resposta">
                                ⚠️ Parcial
                              </span>
                            )}
                          </h4>
                          <div className="pair-files">
                            <div className="pair-file">
                              <span className="file-icon">📐</span>
                              <span className="file-name" title={pair.bimPhoto.fileName}>
                                {pair.bimPhoto.fileName.substring(0, 20)}...
                              </span>
                            </div>
                            <div className="pair-arrow">↔</div>
                            <div className="pair-file">
                              <span className="file-icon">🏗️</span>
                              <span className="file-name" title={pair.obraPhoto.fileName}>
                                {pair.obraPhoto.fileName.substring(0, 20)}...
                              </span>
                            </div>
                          </div>
                          {pair.analysis.success && pair.analysis.data ? (
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
                            <p className="error-message">❌ {pair.analysis.error || 'Erro na análise'}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Imagens Comparadas */}
                <div className="result-card images-card">
                  <div className="card-header">
                    <h3>🖼️ Imagens Analisadas ({comparisonResult.totalPairs || 1} Par{comparisonResult.totalPairs > 1 ? 'es' : ''})</h3>
                  </div>
                  <div className="compared-images">
                    <div className="compared-image-item">
                      <h4>📐 Modelos BIM ({selectedBimPhotos.length})</h4>
                      <div className="multiple-images-preview">
                        {selectedBimPhotos.slice(0, 4).map((photo, index) => (
                          <img key={index} src={photo.url} alt={`BIM ${index + 1}`} className="thumb" />
                        ))}
                        {selectedBimPhotos.length > 4 && (
                          <div className="more-images">+{selectedBimPhotos.length - 4}</div>
                        )}
                      </div>
                    </div>
                    <div className="compared-image-item">
                      <h4>🏗️ Fotos da Obra ({selectedObraPhotos.length})</h4>
                      <div className="multiple-images-preview">
                        {selectedObraPhotos.slice(0, 4).map((photo, index) => (
                          <img key={index} src={photo.url} alt={`Obra ${index + 1}`} className="thumb" />
                        ))}
                        {selectedObraPhotos.length > 4 && (
                          <div className="more-images">+{selectedObraPhotos.length - 4}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}
        </main>
      </div>
    </Layout>
  );
}

export default BimComparison;

