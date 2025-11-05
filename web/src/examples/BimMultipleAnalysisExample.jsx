/**
 * Exemplo de uso da análise múltipla de fotos BIM
 * 
 * Este componente demonstra como usar o serviço de análise múltipla
 * para comparar várias fotos da obra com o modelo BIM
 */

import React, { useState } from 'react';
import vertexAIService from '../services/vertexAIService';

function BimMultipleAnalysisExample() {
  const [bimUrl, setBimUrl] = useState('');
  const [photoUrls, setPhotoUrls] = useState(['', '', '', '']);
  const [context, setContext] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '', phase: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Adicionar mais campos de foto
  const addPhotoField = () => {
    setPhotoUrls([...photoUrls, '']);
  };

  // Remover campo de foto
  const removePhotoField = (index) => {
    const newUrls = photoUrls.filter((_, i) => i !== index);
    setPhotoUrls(newUrls);
  };

  // Atualizar URL de foto específica
  const updatePhotoUrl = (index, value) => {
    const newUrls = [...photoUrls];
    newUrls[index] = value;
    setPhotoUrls(newUrls);
  };

  // Executar análise múltipla
  const handleAnalyze = async () => {
    // Filtrar URLs válidas
    const validPhotoUrls = photoUrls.filter(url => url.trim() !== '');

    if (!bimUrl.trim()) {
      alert('Por favor, forneça a URL do modelo BIM');
      return;
    }

    if (validPhotoUrls.length === 0) {
      alert('Por favor, forneça pelo menos uma foto da obra');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const analysisResult = await vertexAIService.compareMultipleImages(
        bimUrl,
        validPhotoUrls,
        context || 'Análise de progresso da obra',
        (progressData) => {
          console.log('Progresso:', progressData);
          setProgress(progressData);
        }
      );

      console.log('Resultado completo:', analysisResult);
      setResult(analysisResult);
    } catch (error) {
      console.error('Erro ao analisar:', error);
      alert('Erro ao realizar análise: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Análise BIM - Múltiplas Fotos (Exemplo)</h1>
      
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Configuração da Análise</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label>
            <strong>URL do Modelo BIM:</strong>
            <input
              type="text"
              value={bimUrl}
              onChange={(e) => setBimUrl(e.target.value)}
              placeholder="https://exemplo.com/modelo-bim.jpg"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            <strong>Contexto da Obra (opcional):</strong>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ex: Edifício residencial, área da fachada principal..."
              rows={3}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <strong>Fotos da Obra:</strong>
          {photoUrls.map((url, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input
                type="text"
                value={url}
                onChange={(e) => updatePhotoUrl(index, e.target.value)}
                placeholder={`URL da foto ${index + 1}`}
                style={{ flex: 1, padding: '8px' }}
              />
              {photoUrls.length > 1 && (
                <button
                  onClick={() => removePhotoField(index)}
                  style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Remover
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addPhotoField}
            style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            + Adicionar Foto
          </button>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{ 
            padding: '12px 30px', 
            backgroundColor: loading ? '#6c757d' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Analisando...' : 'Analisar Fotos'}
        </button>
      </div>

      {/* Barra de Progresso */}
      {loading && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <h3>Progresso da Análise</h3>
          <p><strong>Fase:</strong> {progress.phase === 'individual' ? 'Analisando fotos individuais' : 'Consolidando resultados'}</p>
          <p><strong>Status:</strong> {progress.message}</p>
          <div style={{ 
            width: '100%', 
            height: '30px', 
            backgroundColor: '#ddd', 
            borderRadius: '15px', 
            overflow: 'hidden',
            marginTop: '10px'
          }}>
            <div style={{ 
              width: `${(progress.current / progress.total) * 100}%`, 
              height: '100%', 
              backgroundColor: '#4caf50',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ textAlign: 'center', marginTop: '5px' }}>
            {progress.current} de {progress.total} ({((progress.current / progress.total) * 100).toFixed(0)}%)
          </p>
        </div>
      )}

      {/* Resultados */}
      {result && result.success && (
        <div>
          {/* Relatório Consolidado */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '2px solid #ffc107' }}>
            <h2>📊 Relatório Consolidado</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '48px', 
                fontWeight: 'bold', 
                color: result.consolidatedAnalysis.data.percentual_conclusao_geral >= 70 ? '#28a745' : result.consolidatedAnalysis.data.percentual_conclusao_geral >= 50 ? '#ffc107' : '#dc3545'
              }}>
                {result.consolidatedAnalysis.data.percentual_conclusao_geral}%
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Conclusão Geral da Obra</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Baseado em {result.totalImages} foto(s) analisada(s)
                </p>
              </div>
            </div>

            {result.consolidatedAnalysis.data.distribuicao_percentuais && (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '4px' }}>
                <h4>Distribuição de Percentuais</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <div>
                    <strong>Mínimo:</strong> {result.consolidatedAnalysis.data.distribuicao_percentuais.minimo}%
                  </div>
                  <div>
                    <strong>Máximo:</strong> {result.consolidatedAnalysis.data.distribuicao_percentuais.maximo}%
                  </div>
                  <div>
                    <strong>Média:</strong> {result.consolidatedAnalysis.data.distribuicao_percentuais.media}%
                  </div>
                  <div>
                    <strong>Desvio:</strong> ±{result.consolidatedAnalysis.data.distribuicao_percentuais.desvio_padrao?.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h4>Análise Consolidada</h4>
              <p style={{ lineHeight: '1.6' }}>{result.consolidatedAnalysis.data.analise_consolidada}</p>
            </div>

            {result.consolidatedAnalysis.data.justificativa_percentual && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Justificativa do Percentual</h4>
                <p style={{ lineHeight: '1.6', fontStyle: 'italic' }}>
                  {result.consolidatedAnalysis.data.justificativa_percentual}
                </p>
              </div>
            )}

            {result.consolidatedAnalysis.data.problemas_consolidados?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4>⚠️ Problemas Consolidados</h4>
                {result.consolidatedAnalysis.data.problemas_consolidados.map((problema, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      padding: '10px', 
                      marginBottom: '10px', 
                      backgroundColor: problema.severidade === 'alta' ? '#f8d7da' : problema.severidade === 'média' ? '#fff3cd' : '#d1ecf1',
                      borderLeft: `4px solid ${problema.severidade === 'alta' ? '#dc3545' : problema.severidade === 'média' ? '#ffc107' : '#17a2b8'}`,
                      borderRadius: '4px'
                    }}
                  >
                    <strong>{problema.tipo}:</strong> {problema.descricao}
                    <br />
                    <small>
                      <strong>Severidade:</strong> {problema.severidade} | 
                      <strong> Frequência:</strong> {problema.frequencia}
                    </small>
                  </div>
                ))}
              </div>
            )}

            {result.consolidatedAnalysis.data.areas_criticas?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4>🚨 Áreas Críticas</h4>
                <ul style={{ lineHeight: '1.8' }}>
                  {result.consolidatedAnalysis.data.areas_criticas.map((area, index) => (
                    <li key={index} style={{ color: '#dc3545', fontWeight: 'bold' }}>{area}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.consolidatedAnalysis.data.pontos_positivos?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4>✅ Pontos Positivos</h4>
                <ul style={{ lineHeight: '1.8' }}>
                  {result.consolidatedAnalysis.data.pontos_positivos.map((ponto, index) => (
                    <li key={index} style={{ color: '#28a745' }}>{ponto}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.consolidatedAnalysis.data.recomendacoes_prioritarias?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4>💡 Recomendações Prioritárias</h4>
                {result.consolidatedAnalysis.data.recomendacoes_prioritarias.map((rec, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      padding: '15px', 
                      marginBottom: '10px', 
                      backgroundColor: 'white',
                      borderLeft: `4px solid ${rec.prioridade === 'alta' ? '#dc3545' : rec.prioridade === 'média' ? '#ffc107' : '#17a2b8'}`,
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      [{rec.prioridade.toUpperCase()}] {rec.acao}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {rec.justificativa}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Análises Individuais */}
          <div>
            <h2>📸 Análises Individuais</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {result.individualAnalyses.map((item) => (
                <div 
                  key={item.imageIndex} 
                  style={{ 
                    padding: '15px', 
                    backgroundColor: 'white', 
                    border: '1px solid #ddd', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <h3>Foto {item.imageIndex}</h3>
                  {item.analysis.success ? (
                    <>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: 'bold', 
                        color: item.analysis.data.percentual_conclusao >= 70 ? '#28a745' : item.analysis.data.percentual_conclusao >= 50 ? '#ffc107' : '#dc3545',
                        marginBottom: '10px'
                      }}>
                        {item.analysis.data.percentual_conclusao}%
                      </div>
                      <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
                        {item.analysis.data.analise_progresso}
                      </p>
                      <p style={{ fontSize: '14px', marginTop: '10px' }}>
                        <strong>Problemas detectados:</strong> {item.analysis.data.problemas_detectados?.length || 0}
                      </p>
                      <p style={{ fontSize: '14px' }}>
                        <strong>Elementos faltantes:</strong> {item.analysis.data.elementos_faltantes?.length || 0}
                      </p>
                    </>
                  ) : (
                    <div style={{ color: '#dc3545' }}>
                      <p><strong>Erro na análise:</strong></p>
                      <p>{item.analysis.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {result && !result.success && (
        <div style={{ padding: '20px', backgroundColor: '#f8d7da', borderRadius: '8px', color: '#721c24' }}>
          <h3>❌ Erro na Análise</h3>
          <p>{result.error}</p>
        </div>
      )}
    </div>
  );
}

export default BimMultipleAnalysisExample;

