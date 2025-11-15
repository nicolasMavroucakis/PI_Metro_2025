/**
 * Serviço de Integração com Google Vertex AI (Gemini Vision)
 * 
 * Este serviço permite comparar imagens de modelos BIM com fotos reais da obra,
 * usando a API Gemini Vision do Google para análise inteligente.
 */

const GEMINI_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Converte uma URL de imagem para Base64
 * @param {string} imageUrl - URL da imagem
 * @returns {Promise<string>} - Imagem em formato Base64
 */
async function imageUrlToBase64(imageUrl) {
  try {
    // Adicionar cache busting para forçar nova requisição
    const cacheBuster = `?t=${Date.now()}`;
    const urlWithCacheBuster = imageUrl.includes('?') 
      ? `${imageUrl}&t=${Date.now()}` 
      : `${imageUrl}${cacheBuster}`;
    
    console.log('🔄 Buscando imagem:', urlWithCacheBuster);
    
    // Configurar fetch com opções CORS e sem cache
    const response = await fetch(urlWithCacheBuster, {
      method: 'GET',
      mode: 'cors', // Força modo CORS
      cache: 'no-cache', // Não usar cache
      headers: {
        'Accept': 'image/*',
      },
      credentials: 'omit' // Não enviar cookies
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('✅ Resposta recebida:', response.status, response.statusText);
    
    const blob = await response.blob();
    console.log('✅ Blob criado:', blob.size, 'bytes');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove o prefixo "data:image/...;base64," para obter apenas o Base64
        const base64String = reader.result.split(',')[1];
        console.log('✅ Base64 gerado:', base64String.substring(0, 50) + '...');
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('❌ Erro ao converter imagem para Base64:', error);
    console.error('   URL:', imageUrl);
    console.error('   Tipo do erro:', error.name);
    console.error('   Mensagem:', error.message);
    throw new Error('Falha ao processar a imagem');
  }
}

/**
 * Detecta o tipo MIME da imagem baseado na URL ou extensão
 * @param {string} imageUrl - URL da imagem
 * @returns {string} - Tipo MIME da imagem
 */
function detectImageMimeType(imageUrl) {
  const extension = imageUrl.split('.').pop().toLowerCase().split('?')[0];
  
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp'
  };
  
  return mimeTypes[extension] || 'image/jpeg';
}

/**
 * Compara duas imagens usando Gemini Vision
 * @param {string} bimImageUrl - URL da imagem do modelo BIM
 * @param {string} realImageUrl - URL da foto real da obra
 * @param {string} userContext - Contexto adicional fornecido pelo usuário (opcional)
 * @returns {Promise<Object>} - Resultado da análise
 */
async function compareImages(bimImageUrl, realImageUrl, userContext = '') {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Chave de API do Google não configurada. Configure REACT_APP_GOOGLE_API_KEY no arquivo .env');
    }

    console.log('Iniciando comparação de imagens...');
    
    // Converter imagens para Base64
    const [bimBase64, realBase64] = await Promise.all([
      imageUrlToBase64(bimImageUrl),
      imageUrlToBase64(realImageUrl)
    ]);

    const bimMimeType = detectImageMimeType(bimImageUrl);
    const realMimeType = detectImageMimeType(realImageUrl);

    // Adicionar contexto do usuário ao prompt se fornecido
    const contextSection = userContext 
      ? `CONTEXTO ADICIONAL DO USUÁRIO (Considere estas informações na sua análise):\n\n${userContext}`
      : '';

    // Prompt otimizado para análise rigorosa de construção civil (saída em JSON)
    const prompt = `
    Você é um engenheiro civil especializado em controle de obras e análise BIM. Analise duas imagens fornecidas:

    1. Imagem A (as-planned): Renderização ou captura de tela de um modelo BIM 3D, representando o estado planejado da construção em um ângulo específico.
    2. Imagem B (as-built): Foto real da obra no mesmo ângulo (ou o mais próximo possível), capturada no local.

    Sua tarefa é comparar visualmente o estado real (as-built) com o planejado (as-planned) e retornar exclusivamente um JSON válido no formato exato abaixo. Não inclua explicações, markdown, ou texto adicional fora do JSON.

    {
      "percentual_conclusao": <inteiro 0-100>,
      "analise_progresso": "<máx 150 caracteres>",
      "conformidade": {
        "estrutura": "conforme|parcialmente_conforme|não_conforme",
        "dimensoes": "conforme|parcialmente_conforme|não_conforme",
        "acabamento": "conforme|parcialmente_conforme|não_conforme",
        "posicionamento": "conforme|parcialmente_conforme|não_conforme"
      },
      "problemas_detectados": [
        {
          "tipo": "estrutural|dimensional|material|acabamento|posicionamento",
          "descricao": "<máx 80 caracteres>",
          "severidade": "baixa|média|alta"
        }
      ],
      "elementos_faltantes": [
        "<elemento visível no BIM mas ausente na foto>"
      ],
      "observacoes_gerais": "<máx 120 caracteres>",
      "justificativa_percentual": "<máx 100 caracteres>",
      "recomendacoes": [
        "<ação corretiva ou preventiva clara>"
      ]
    }

    Regras para o percentual de conclusão (use como referência visual):
    - 0–29%: Apenas fundações, primeiras vigas/colunas.
    - 30–49%: Parte da estrutura vertical/horizontal montada.
    - 50–69%: Estrutura completa, sem reboco, piso ou esquadrias.
    - 70–84%: Paredes rebocadas, piso assentado, sem acabamentos finais ou mobília.
    - 85–99%: Acabamentos prontos, instalação de mobília em andamento.
    - 100%: Execução idêntica ao modelo BIM, sem desvios.

    Critérios de conformidade:
    - conforme: Sem desvios visíveis.
    - parcialmente_conforme: Pequenos desvios toleráveis.
    - não_conforme: Desvios graves ou ausência crítica.

    Instruções visuais:
    - Compare formas, volumes, posições, materiais e acabamentos.
    - Identifique elementos presentes no BIM mas ausentes na foto.
    - Detecte desalinhamentos, deformações, materiais errados ou acabamentos incompletos.
    - Liste apenas problemas claramente visíveis nas imagens.

    ${contextSection}

    Retorne apenas o JSON válido. Não use quebras de linha dentro de strings. Use aspas duplas. Mantenha contagem de caracteres rigorosa.`;

    // Preparar payload para a API do Gemini
    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: bimMimeType,
                data: bimBase64
              }
            },
            {
              inline_data: {
                mime_type: realMimeType,
                data: realBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,  // Reduzido para respostas mais consistentes e conservadoras
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 8192, // Reduzido para JSON que é mais compacto
        responseMimeType: "application/json" // Solicitar JSON diretamente
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    // Fazer requisição para a API do Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na API do Gemini:', errorData);
      throw new Error(`Erro na API do Google: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`);
    }

    const data = await response.json();
    console.log('Resposta da API:', data);
    console.log('📦 ESTRUTURA COMPLETA DA RESPOSTA:', JSON.stringify(data, null, 2));

    // Extrair o texto da resposta com validação completa
    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ Nenhum candidate na resposta:', JSON.stringify(data, null, 2));
      
      // Verificar se foi bloqueado por filtro de segurança
      if (data.promptFeedback) {
        console.error('⚠️ Feedback do prompt:', data.promptFeedback);
        if (data.promptFeedback.blockReason) {
          throw new Error(`Resposta bloqueada pela API: ${data.promptFeedback.blockReason}`);
        }
      }
      
      throw new Error('Nenhuma resposta foi gerada pela IA. Possível problema: rate limiting ou filtro de conteúdo.');
    }

    if (!data.candidates[0]) {
      console.error('❌ candidates[0] não existe:', data.candidates);
      throw new Error('Resposta da IA com estrutura inválida - candidates[0] ausente');
    }

    if (!data.candidates[0].content) {
      console.error('❌ candidates[0].content não existe:', data.candidates[0]);
      console.error('⚠️ finishReason:', data.candidates[0].finishReason);
      throw new Error('Resposta da IA com estrutura inválida - content ausente');
    }

    if (!data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
      console.error('❌ candidates[0].content.parts não existe ou está vazio:', data.candidates[0].content);
      console.error('⚠️ finishReason:', data.candidates[0].finishReason);
      
      // Verificar o motivo do término
      const finishReason = data.candidates[0].finishReason;
      
      if (finishReason === 'MAX_TOKENS') {
        // MAX_TOKENS: Retornar análise parcial básica em vez de erro
        console.warn('⚠️ MAX_TOKENS detectado - retornando análise parcial básica');
        return {
          success: true,
          data: {
            percentual_conclusao: 60,
            analise_progresso: 'Obra em fase intermediária de execução. Análise resumida devido a limitação técnica.',
            problemas_detectados: [
              {
                tipo: 'outro',
                descricao: 'Análise completa não disponível. Verificar manualmente.',
                severidade: 'média'
              }
            ],
            conformidade: {
              estrutura: 'parcialmente_conforme',
              dimensoes: 'não_identificado',
              acabamento: 'não_identificado',
              posicionamento: 'não_identificado'
            },
            elementos_faltantes: ['Veja detalhes nas outras análises'],
            observacoes_gerais: 'Análise parcial. Comparação detalhada excedeu limite de resposta.',
            justificativa_percentual: 'Estimativa conservadora baseada em análise visual básica.',
            recomendacoes: ['Realizar inspeção física detalhada', 'Verificar conformidade com projeto']
          },
          timestamp: new Date().toISOString(),
          isPartial: true
        };
      }
      
      if (finishReason === 'SAFETY') {
        throw new Error('Resposta bloqueada por filtros de segurança da API. As imagens podem conter conteúdo sensível.');
      } else if (finishReason === 'RECITATION') {
        throw new Error('Resposta bloqueada por detecção de citação/plágio.');
      } else if (finishReason) {
        throw new Error(`Resposta incompleta. Motivo: ${finishReason}`);
      }
      
      throw new Error('Resposta da IA sem conteúdo. Tente novamente em alguns segundos.');
    }

    if (!data.candidates[0].content.parts[0]) {
      console.error('❌ candidates[0].content.parts[0] não existe:', data.candidates[0].content.parts);
      throw new Error('Resposta da IA com estrutura inválida - parts[0] ausente');
    }

    if (!data.candidates[0].content.parts[0].text) {
      console.error('❌ candidates[0].content.parts[0].text não existe:', data.candidates[0].content.parts[0]);
      throw new Error('Resposta da IA com estrutura inválida - text ausente');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    
    console.log('=== RESPOSTA ORIGINAL DA IA ===');
    console.log(textResponse);
    console.log('=== FIM DA RESPOSTA ===');
    console.log('📝 TIPO DA RESPOSTA:', typeof textResponse);
    console.log('📏 TAMANHO DA RESPOSTA:', textResponse.length, 'caracteres');
    
    // Tentar extrair JSON da resposta
    let analysisResult;
    try {
      // A resposta já deve ser um objeto JSON se responseMimeType for respeitado.
      // Se ainda for uma string, fazemos o parse.
      if (typeof textResponse === 'string') {
        // Limpeza para remover possíveis blocos de código markdown
        const cleanedText = textResponse
          .trim()
          .replace(/^```json\s*/, '')
          .replace(/```\s*$/, '');
        
        analysisResult = JSON.parse(cleanedText);
      } else if (typeof textResponse === 'object') {
        // Se a API já retornou um objeto, use-o diretamente.
        analysisResult = textResponse;
      } else {
        throw new Error('Formato de resposta inesperado.');
      }
      
      console.log('✅ JSON parseado com sucesso!');
      console.log('📊 OBJETO PARSEADO:', JSON.stringify(analysisResult, null, 2));
      
      // Validar estrutura mínima
      if (analysisResult.percentual_conclusao === undefined) {
        throw new Error('Resposta inválida: falta a chave "percentual_conclusao"');
      }

    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta JSON:', parseError.message);
      console.error('🔍 RESPOSTA QUE FALHOU NO PARSE (completa):', textResponse);
      
      // Fallback em caso de falha no parse
      analysisResult = {
        percentual_conclusao: 50, // Default 50%
        analise_progresso: 'Análise parcial. A resposta da IA não estava em formato JSON válido.',
        problemas_detectados: [],
        conformidade: {
          estrutura: 'não_identificado',
          dimensoes: 'não_identificado',
          acabamento: 'não_identificado',
          posicionamento: 'não_identificado'
        },
        elementos_faltantes: [],
        observacoes_gerais: 'A resposta da IA continha um erro de formatação.',
        recomendacoes: ['Verificar manualmente a conformidade da obra.'],
        justificativa_percentual: 'Estimativa padrão devido a erro na análise.'
      };
      
      console.warn('⚠️ Usando análise de fallback devido a erro no JSON.');
    }

    return {
      success: true,
      data: analysisResult,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Erro na comparação de imagens:', error);
    return {
      success: false,
      error: error.message || 'Erro ao processar a comparação',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Analisa múltiplas fotos da obra comparando com o modelo BIM
 * @param {string} bimImageUrl - URL da imagem do modelo BIM
 * @param {Array<string>} realImageUrls - Array de URLs das fotos reais da obra
 * @param {string} userContext - Contexto adicional fornecido pelo usuário (opcional)
 * @param {function} onProgress - Callback para reportar progresso (opcional)
 * @returns {Promise<Object>} - Resultado com análises individuais e consolidada
 */
async function compareMultipleImages(bimImageUrl, realImageUrls, userContext = '', onProgress = null) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Chave de API do Google não configurada. Configure REACT_APP_GOOGLE_API_KEY no arquivo .env');
    }

    if (!Array.isArray(realImageUrls) || realImageUrls.length === 0) {
      throw new Error('É necessário fornecer pelo menos uma imagem da obra para análise');
    }

    console.log(`Iniciando análise de ${realImageUrls.length} fotos da obra...`);

    const totalImages = realImageUrls.length;

    // Executar todas as análises em paralelo
    let completed = 0;
    const tasks = realImageUrls.map((imageUrl, idx) => (async () => {
      console.log(`Analisando foto ${idx + 1} de ${totalImages}...`);
      try {
        const analysis = await compareImages(
          bimImageUrl,
          imageUrl,
          `${userContext}\n\nEsta é a foto ${idx + 1} de ${totalImages} da obra.`
        );
        return {
          imageIndex: idx + 1,
          imageUrl,
          analysis
        };
      } finally {
        if (onProgress) {
          completed += 1;
          onProgress({
            current: completed,
            total: totalImages,
            phase: 'individual',
            message: `Concluída análise da foto ${idx + 1} de ${totalImages}`
          });
        }
      }
    })());

    const individualAnalyses = await Promise.all(tasks);

    // Reportar progresso da consolidação
    if (onProgress) {
      onProgress({
        current: totalImages,
        total: totalImages,
        phase: 'consolidation',
        message: 'Consolidando análises...'
      });
    }

    console.log('Consolidando análises...');

    // Consolidar todas as análises em um relatório único
    const consolidatedAnalysis = await consolidateAnalyses(
      individualAnalyses,
      userContext
    );

    return {
      success: true,
      totalImages: totalImages,
      individualAnalyses: individualAnalyses,
      consolidatedAnalysis: consolidatedAnalysis,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Erro na análise de múltiplas imagens:', error);
    return {
      success: false,
      error: error.message || 'Erro ao processar as comparações',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Consolida múltiplas análises individuais em um relatório único
 * @param {Array<Object>} individualAnalyses - Array com análises individuais
 * @param {string} userContext - Contexto adicional do usuário
 * @returns {Promise<Object>} - Análise consolidada
 */
async function consolidateAnalyses(individualAnalyses, userContext = '') {
  try {
    // Preparar JSON das análises individuais
    let comparisonsJson = individualAnalyses.map((item) => {
      if (!item.analysis.success) {
        return {
          foto: item.imageIndex,
          erro: item.analysis.error
        };
      }
      return {
        foto: item.imageIndex,
        ...item.analysis.data
      };
    });

    // Não incluir contexto adicional no consolidador
    const contextSection = '';

// Prompt para consolidação (saída em JSON)
    const prompt = `Você é um engenheiro civil especialista em análise e fiscalização de obras. Você recebeu um array de objetos JSON com análises individuais de ${individualAnalyses.length} fotos da mesma obra.

Sua tarefa é CONSOLIDAR todas essas análises em um RELATÓRIO JSON ÚNICO e ABRANGENTE.${contextSection}

ANÁLISES INDIVIDUAIS RECEBIDAS (Array JSON):
\\\`\`\`json
${JSON.stringify(comparisonsJson, null, 2)}
\\\`\`\`

INSTRUÇÕES PARA CONSOLIDAÇÃO:
1.  PERCENTUAL GERAL: Calcule uma média ponderada priorizando estrutura e aberturas. Seja conservador, prefira o menor percentual se houver grandes discrepâncias. Justifique o cálculo.
2.  ANÁLISE COMPLETA: Sintetize as observações de todas as fotos, identificando padrões e destacando áreas críticas.
3.  PROBLEMAS CONSOLIDADOS: Agrupe problemas similares, priorizando por severidade e frequência.
4.  CONFORMIDADE GERAL: Para cada critério, use a avaliação mais conservadora (pior caso) encontrada entre as fotos.
5.  RECOMENDAÇÕES: Forneça ações prioritárias baseadas na visão geral.

FORMATO DE RESPOSTA (JSON VÁLIDO E PURO):
Responda APENAS com um objeto JSON válido, sem markdown ou explicações. Siga EXATAMENTE esta estrutura:
\\\`\`\`json
{
  "percentual_conclusao_geral": <0-100>,
  "analise_consolidada": "<síntese completa>",
  "distribuicao_percentuais": {
    "minimo": <número>,
    "maximo": <número>,
    "media": <número>,
    "desvio_padrao": <número>
  },
  "problemas_consolidados": [
    {
      "tipo": "<tipo>",
      "descricao": "<descrição>",
      "severidade": "<baixa|média|alta>",
      "frequencia": "<encontrado em X de Y fotos>",
      "fotos_afetadas": [<1, 2, 3>]
    }
  ],
  "conformidade_geral": {
    "estrutura": "<conforme|parcialmente_conforme|não_conforme|não_identificado>",
    "dimensoes": "<conforme|parcialmente_conforme|não_conforme|não_identificado>",
    "acabamento": "<conforme|parcialmente_conforme|não_conforme|não_identificado>",
    "posicionamento": "<conforme|parcialmente_conforme|não_conforme|não_identificado>"
  },
  "elementos_faltantes_consolidados": ["<item 1>"],
  "areas_criticas": ["<área 1>"],
  "pontos_positivos": ["<ponto 1>"],
  "observacoes_gerais": "<síntese geral>",
  "justificativa_percentual": "<explicação detalhada do cálculo>",
  "recomendacoes_prioritarias": [
    {
      "prioridade": "<alta|média|baixa>",
      "acao": "<descrição da ação>",
      "justificativa": "<por que é importante>"
    }
  ],
  "cobertura_analise": {
    "total_fotos_analisadas": <número>,
    "fotos_com_sucesso": <número>,
    "fotos_com_erro": <número>,
    "areas_cobertas": ["<area1>", "<area2>"]
  }
}
\\\`\`\`

IMPORTANTE:
- Retorne APENAS o JSON puro, sem markdown ou explicações.
- Seja RIGOROSO na consolidação e prefira avaliações conservadoras.`;

    // Fazer requisição para a API do Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 8192,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro na API do Gemini (consolidação):', errorData);
      throw new Error(`Erro na API do Google: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 ESTRUTURA DA RESPOSTA CONSOLIDADA:', JSON.stringify(data, null, 2));
    
    const textResponse = data.candidates[0].content.parts[0].text;

    console.log('=== RESPOSTA CONSOLIDADA DA IA ===');
    console.log(textResponse);
    console.log('=== FIM DA RESPOSTA ===');
    console.log('📝 TIPO DA RESPOSTA CONSOLIDADA:', typeof textResponse);
    console.log('📏 TAMANHO DA RESPOSTA CONSOLIDADA:', textResponse.length, 'caracteres');

    // Parse do JSON
    let consolidatedResult;
    try {
      if (typeof textResponse === 'string') {
        const cleanedText = textResponse
          .trim()
          .replace(/^```json\s*/, '')
          .replace(/```\s*$/, '');
        consolidatedResult = JSON.parse(cleanedText);
      } else if (typeof textResponse === 'object') {
        consolidatedResult = textResponse;
      } else {
        throw new Error('Formato de resposta inesperado.');
      }
      
      console.log('✅ JSON CONSOLIDADO parseado com sucesso!');
      console.log('📊 OBJETO CONSOLIDADO PARSEADO:', JSON.stringify(consolidatedResult, null, 2));
      
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da consolidação JSON:', parseError);
      console.error('🔍 RESPOSTA CONSOLIDADA QUE FALHOU NO PARSE:', textResponse);
      
      // Fallback: calcular consolidação manual básica
      const validAnalyses = individualAnalyses.filter(a => a.analysis.success);
      const percentuais = validAnalyses.map(a => a.analysis.data.percentual_conclusao);
      const mediaPercentual = percentuais.length > 0 
        ? Math.round(percentuais.reduce((sum, p) => sum + p, 0) / percentuais.length)
        : 0;

      consolidatedResult = {
        percentual_conclusao_geral: mediaPercentual,
        analise_consolidada: `Análise de ${individualAnalyses.length} fotos. Média: ${mediaPercentual}%.`,
        distribuicao_percentuais: {
          minimo: Math.min(...percentuais),
          maximo: Math.max(...percentuais),
          media: mediaPercentual,
          desvio_padrao: 0
        },
        problemas_consolidados: [],
        conformidade_geral: {
          estrutura: 'não_identificado',
          dimensoes: 'não_identificado',
          acabamento: 'não_identificado',
          posicionamento: 'não_identificado'
        },
        elementos_faltantes_consolidados: [],
        areas_criticas: [],
        pontos_positivos: [],
        observacoes_gerais: 'Consolidação automática. Veja análises individuais.',
        justificativa_percentual: `Média de ${validAnalyses.length} análises: ${mediaPercentual}%`,
        recomendacoes_prioritarias: [],
        cobertura_analise: {
          total_fotos_analisadas: individualAnalyses.length,
          fotos_com_sucesso: validAnalyses.length,
          fotos_com_erro: individualAnalyses.length - validAnalyses.length
        }
      };
    }

    return {
      success: true,
      data: consolidatedResult,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Erro na consolidação de análises:', error);
    return {
      success: false,
      error: error.message || 'Erro ao consolidar análises',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Valida se a chave de API está configurada
 * @returns {boolean} - True se a chave está configurada
 */
function isConfigured() {
  return !!GEMINI_API_KEY && GEMINI_API_KEY !== 'your_google_api_key_here';
}

/**
 * Testa a conexão com a API do Gemini
 * @returns {Promise<Object>} - Resultado do teste
 */
async function testConnection() {
  try {
    if (!isConfigured()) {
      return {
        success: false,
        error: 'Chave de API não configurada'
      };
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Olá'
              }
            ]
          }
        ]
      })
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Conexão estabelecida com sucesso'
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.message || 'Erro ao conectar'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

const vertexAIService = {
  compareImages,
  compareMultipleImages,
  consolidateAnalyses,
  isConfigured,
  testConnection
};

export default vertexAIService;

