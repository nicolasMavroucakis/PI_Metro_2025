# Análise Múltipla de Fotos BIM

## 📋 Visão Geral

Este documento explica como usar o sistema de **análise múltipla de fotos da obra**, que permite comparar várias fotos reais da obra com o modelo BIM e obter um relatório consolidado completo.

## 🎯 Funcionalidades

### 1. Análise Individual (Função Original)
- Compara **1 foto** da obra com o modelo BIM
- Retorna análise detalhada dessa foto específica

### 2. Análise Múltipla (Nova Funcionalidade)
- Compara **múltiplas fotos** da obra com o mesmo modelo BIM
- Analisa cada foto individualmente
- Consolida todas as análises em um **relatório único e abrangente**
- Fornece percentual geral da obra
- Identifica problemas recorrentes
- Mostra distribuição de percentuais entre as fotos

## 🚀 Como Usar

### Importar o Serviço

```javascript
import vertexAIService from '../services/vertexAIService';
```

### Exemplo 1: Análise de Foto Única (Uso Original)

```javascript
const result = await vertexAIService.compareImages(
  'https://exemplo.com/modelo-bim.jpg',     // URL do modelo BIM
  'https://exemplo.com/foto-obra.jpg',      // URL da foto real
  'Área da fachada principal'               // Contexto (opcional)
);

if (result.success) {
  console.log('Percentual:', result.data.percentual_conclusao);
  console.log('Análise:', result.data.analise_progresso);
  console.log('Problemas:', result.data.problemas_detectados);
}
```

### Exemplo 2: Análise de Múltiplas Fotos (Nova Funcionalidade)

```javascript
// Array com URLs das fotos da obra
const fotosObra = [
  'https://exemplo.com/foto-fachada.jpg',
  'https://exemplo.com/foto-lateral.jpg',
  'https://exemplo.com/foto-fundos.jpg',
  'https://exemplo.com/foto-interno.jpg'
];

// Callback para acompanhar o progresso (opcional)
const handleProgress = (progress) => {
  console.log(`${progress.message} (${progress.current}/${progress.total})`);
  
  if (progress.phase === 'individual') {
    // Analisando fotos individuais
    console.log(`Progresso: ${(progress.current / progress.total * 100).toFixed(0)}%`);
  } else if (progress.phase === 'consolidation') {
    // Consolidando resultados
    console.log('Gerando relatório consolidado...');
  }
};

// Executar análise múltipla
const result = await vertexAIService.compareMultipleImages(
  'https://exemplo.com/modelo-bim.jpg',     // URL do modelo BIM
  fotosObra,                                  // Array de URLs das fotos
  'Obra do edifício residencial XYZ',        // Contexto (opcional)
  handleProgress                              // Callback de progresso (opcional)
);

if (result.success) {
  // Análises individuais de cada foto
  result.individualAnalyses.forEach((item) => {
    console.log(`\nFoto ${item.imageIndex}:`);
    if (item.analysis.success) {
      console.log(`- Percentual: ${item.analysis.data.percentual_conclusao}%`);
      console.log(`- Problemas: ${item.analysis.data.problemas_detectados.length}`);
    } else {
      console.log(`- Erro: ${item.analysis.error}`);
    }
  });

  // Análise consolidada
  const consolidated = result.consolidatedAnalysis.data;
  console.log('\n=== RELATÓRIO CONSOLIDADO ===');
  console.log('Percentual Geral:', consolidated.percentual_conclusao_geral + '%');
  console.log('Análise:', consolidated.analise_consolidada);
  console.log('Distribuição:', consolidated.distribuicao_percentuais);
  console.log('Problemas Consolidados:', consolidated.problemas_consolidados);
  console.log('Áreas Críticas:', consolidated.areas_criticas);
  console.log('Pontos Positivos:', consolidated.pontos_positivos);
  console.log('Recomendações:', consolidated.recomendacoes_prioritarias);
}
```

## 📊 Estrutura da Resposta

### Resposta da Análise Múltipla

```javascript
{
  success: true,
  totalImages: 4,                    // Total de fotos analisadas
  individualAnalyses: [              // Array com análises individuais
    {
      imageIndex: 1,
      imageUrl: "...",
      analysis: {
        success: true,
        data: {
          percentual_conclusao: 75,
          analise_progresso: "...",
          problemas_detectados: [...],
          conformidade: {...},
          // ... outros campos da análise individual
        }
      }
    },
    // ... mais análises
  ],
  consolidatedAnalysis: {            // Análise consolidada
    success: true,
    data: {
      percentual_conclusao_geral: 78,
      analise_consolidada: "Síntese completa...",
      distribuicao_percentuais: {
        minimo: 70,
        maximo: 85,
        media: 78,
        desvio_padrao: 5.2
      },
      problemas_consolidados: [
        {
          tipo: "acabamento",
          descricao: "Falta de pintura final em múltiplas áreas",
          severidade: "média",
          frequencia: "encontrado em 3 de 4 fotos",
          fotos_afetadas: [1, 2, 4]
        }
      ],
      conformidade_geral: {
        estrutura: "conforme",
        dimensoes: "parcialmente_conforme",
        acabamento: "não_conforme",
        posicionamento: "conforme",
        materiais: "parcialmente_conforme",
        cores_texturas: "não_conforme"
      },
      elementos_faltantes_consolidados: [
        "Guarda-corpos externos",
        "Pintura final das paredes"
      ],
      areas_criticas: [
        "Fachada frontal requer acabamento urgente",
        "Área interna com problemas de nivelamento"
      ],
      pontos_positivos: [
        "Estrutura principal bem executada e conforme",
        "Fundações corretamente dimensionadas"
      ],
      observacoes_gerais: "Obra em estágio avançado...",
      justificativa_percentual: "Calculado com base na média ponderada...",
      recomendacoes_prioritarias: [
        {
          prioridade: "alta",
          acao: "Finalizar pintura externa",
          justificativa: "Problema identificado em 75% das fotos"
        },
        {
          prioridade: "média",
          acao: "Instalar guarda-corpos",
          justificativa: "Item de segurança essencial"
        }
      ],
      cobertura_analise: {
        total_fotos_analisadas: 4,
        fotos_com_sucesso: 4,
        fotos_com_erro: 0,
        areas_cobertas: [
          "Fachada frontal",
          "Lateral direita",
          "Área dos fundos",
          "Ambiente interno"
        ]
      }
    }
  },
  timestamp: "2025-11-04T..."
}
```

## 🎨 Exemplo de Interface React

```javascript
import React, { useState } from 'react';
import vertexAIService from '../services/vertexAIService';

function BimMultipleAnalysis() {
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (bimImageUrl, photoUrls) => {
    setLoading(true);
    setResult(null);
    
    const analysisResult = await vertexAIService.compareMultipleImages(
      bimImageUrl,
      photoUrls,
      'Análise completa da obra',
      (progressData) => {
        setProgress(progressData);
      }
    );
    
    setResult(analysisResult);
    setLoading(false);
  };

  return (
    <div>
      <h2>Análise BIM - Múltiplas Fotos</h2>
      
      {loading && (
        <div className="progress-bar">
          <p>{progress.message}</p>
          <p>{progress.current} de {progress.total}</p>
          <div 
            className="bar" 
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
      )}
      
      {result && result.success && (
        <div className="results">
          <div className="consolidated-summary">
            <h3>Relatório Consolidado</h3>
            <div className="score">
              <span className="percentage">
                {result.consolidatedAnalysis.data.percentual_conclusao_geral}%
              </span>
              <span className="label">Conclusão Geral</span>
            </div>
            
            <div className="distribution">
              <p>Mínimo: {result.consolidatedAnalysis.data.distribuicao_percentuais.minimo}%</p>
              <p>Máximo: {result.consolidatedAnalysis.data.distribuicao_percentuais.maximo}%</p>
              <p>Média: {result.consolidatedAnalysis.data.distribuicao_percentuais.media}%</p>
            </div>
            
            <h4>Análise Geral</h4>
            <p>{result.consolidatedAnalysis.data.analise_consolidada}</p>
            
            <h4>Problemas Consolidados</h4>
            {result.consolidatedAnalysis.data.problemas_consolidados.map((problema, index) => (
              <div key={index} className={`problem ${problema.severidade}`}>
                <strong>{problema.tipo}:</strong> {problema.descricao}
                <br />
                <small>
                  Severidade: {problema.severidade} | {problema.frequencia}
                </small>
              </div>
            ))}
            
            <h4>Áreas Críticas</h4>
            <ul>
              {result.consolidatedAnalysis.data.areas_criticas?.map((area, index) => (
                <li key={index} className="critical">{area}</li>
              ))}
            </ul>
            
            <h4>Pontos Positivos</h4>
            <ul>
              {result.consolidatedAnalysis.data.pontos_positivos?.map((ponto, index) => (
                <li key={index} className="positive">{ponto}</li>
              ))}
            </ul>
            
            <h4>Recomendações Prioritárias</h4>
            {result.consolidatedAnalysis.data.recomendacoes_prioritarias?.map((rec, index) => (
              <div key={index} className={`recommendation priority-${rec.prioridade}`}>
                <strong>[{rec.prioridade.toUpperCase()}]</strong> {rec.acao}
                <br />
                <small>{rec.justificativa}</small>
              </div>
            ))}
          </div>
          
          <div className="individual-analyses">
            <h3>Análises Individuais</h3>
            {result.individualAnalyses.map((item) => (
              <div key={item.imageIndex} className="individual-card">
                <h4>Foto {item.imageIndex}</h4>
                <img src={item.imageUrl} alt={`Foto ${item.imageIndex}`} />
                {item.analysis.success && (
                  <>
                    <p className="score">
                      Conclusão: {item.analysis.data.percentual_conclusao}%
                    </p>
                    <p>{item.analysis.data.analise_progresso}</p>
                    <p>
                      <strong>Problemas:</strong> {item.analysis.data.problemas_detectados.length}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BimMultipleAnalysis;
```

## ⚙️ Características Técnicas

### Performance
- **Análise Sequencial**: As fotos são analisadas uma por vez para evitar sobrecarga da API
- **Delay entre Requisições**: 1 segundo de delay entre análises para evitar rate limiting
- **Callback de Progresso**: Acompanhe o progresso em tempo real

### Consolidação Inteligente
A IA realiza uma consolidação inteligente que:
- ✅ Calcula média ponderada dos percentuais
- ✅ Identifica problemas recorrentes
- ✅ Agrupa problemas similares
- ✅ Remove duplicatas de elementos faltantes
- ✅ Usa avaliações conservadoras em discrepâncias
- ✅ Fornece justificativa detalhada do percentual final
- ✅ Identifica áreas críticas e pontos positivos
- ✅ Prioriza recomendações por severidade e impacto

### Fallback
Se houver erro no parse da consolidação, o sistema:
- ✅ Calcula média manual dos percentuais
- ✅ Retorna dados básicos de consolidação
- ✅ Mantém as análises individuais disponíveis

## 🔧 Tratamento de Erros

```javascript
const result = await vertexAIService.compareMultipleImages(
  bimUrl,
  photosUrls,
  context
);

if (!result.success) {
  console.error('Erro na análise múltipla:', result.error);
  // Tratar erro
  return;
}

// Verificar se alguma foto individual falhou
result.individualAnalyses.forEach((item) => {
  if (!item.analysis.success) {
    console.warn(`Foto ${item.imageIndex} falhou:`, item.analysis.error);
  }
});

// Verificar se a consolidação falhou
if (!result.consolidatedAnalysis.success) {
  console.warn('Consolidação falhou:', result.consolidatedAnalysis.error);
  // Pode usar apenas as análises individuais
}
```

## 📝 Boas Práticas

1. **Quantidade de Fotos**: Recomendado entre 3-8 fotos para melhor cobertura
2. **Ângulos Diversos**: Tire fotos de diferentes ângulos e áreas da obra
3. **Qualidade**: Use fotos claras e bem iluminadas
4. **Contexto**: Forneça contexto relevante sobre a obra
5. **Progresso**: Use o callback de progresso para feedback ao usuário
6. **Tratamento**: Sempre trate erros individuais e de consolidação

## 🎯 Casos de Uso

### 1. Relatório Mensal da Obra
Analise múltiplas fotos de diferentes áreas para gerar relatório completo do progresso.

### 2. Inspeção de Qualidade
Compare várias fotos para identificar problemas recorrentes em toda a obra.

### 3. Documentação de Etapas
Documente diferentes etapas da obra com análises individuais e consolidadas.

### 4. Apresentação para Stakeholders
Gere relatórios visuais consolidados para apresentar o andamento da obra.

## 🔄 Migração da Análise Única para Múltipla

Se você já usa a análise única e quer migrar:

```javascript
// Antes (análise única)
const result = await vertexAIService.compareImages(bimUrl, photoUrl, context);

// Depois (análise múltipla com uma foto)
const result = await vertexAIService.compareMultipleImages(
  bimUrl, 
  [photoUrl],  // Array com uma foto
  context
);

// Você terá acesso a:
// - result.individualAnalyses[0].analysis (mesma estrutura da análise única)
// - result.consolidatedAnalysis (análise geral, mesmo sendo uma foto só)
```

## 📚 Documentação de Referência

Para mais detalhes sobre a estrutura de dados da análise individual, consulte o código em:
- `web/src/services/vertexAIService.js`

## ✨ Novos Campos na Análise Consolidada

Campos exclusivos da análise múltipla:
- `distribuicao_percentuais`: Estatísticas dos percentuais
- `problemas_consolidados`: Problemas agrupados com frequência
- `areas_criticas`: Áreas que requerem atenção imediata
- `pontos_positivos`: Aspectos bem executados
- `recomendacoes_prioritarias`: Ações priorizadas com justificativa
- `cobertura_analise`: Informações sobre cobertura da análise

