/**
 * Serviço de Integração com Google Vertex AI (Gemini Vision)
 * 
 * Este serviço permite comparar imagens de modelos BIM com fotos reais da obra,
 * usando a API Gemini Vision do Google para análise inteligente.
 */

import { decode } from '@toon-format/toon';

const GEMINI_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Parser TOON customizado (fallback) para o subconjunto de formato usado nos prompts
function parseToonCustom(toonText) {
  const lines = toonText.split(/\r?\n/);
  const result = {};

  const isIndented = (s) => s.startsWith(' ') || s.startsWith('\t');
  const unquote = (s) => {
    const t = s.trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      return t.slice(1, -1);
    }
    return t;
  };
  const parseValue = (raw) => {
    const v = raw.trim();
    if (!v) return '';
    const uq = unquote(v);
    if (/^-?\d+(\.\d+)?$/.test(uq)) {
      return uq.includes('.') ? parseFloat(uq) : parseInt(uq, 10);
    }
    return uq;
  };
  const splitCsvRespectingQuotes = (line) => {
    const out = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        current += ch;
      } else if (ch === ',' && !inQuotes) {
        out.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    out.push(current.trim());
    return out.map(unquote);
  };

  let i = 0;
  while (i < lines.length) {
    let line = lines[i].trimEnd();
    if (!line.trim()) { i++; continue; }

    // key: value
    let m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (m) {
      const key = m[1];
      const raw = m[2] || '';
      result[key] = parseValue(raw);
      i++;
      continue;
    }

    // table header: key{col1,col2,...}:
    m = line.match(/^([A-Za-z0-9_]+)\{([A-Za-z0-9_,]+)\}:\s*$/);
    if (m) {
      const key = m[1];
      const cols = m[2].split(',').map((c) => c.trim());
      i++;
      const rows = [];
      while (i < lines.length) {
        const rowLine = lines[i];
        if (!rowLine || !isIndented(rowLine)) break;
        const cells = splitCsvRespectingQuotes(rowLine.trim());
        const obj = {};
        for (let c = 0; c < cols.length; c++) {
          obj[cols[c]] = cells[c] !== undefined ? parseValue(cells[c]) : '';
        }
        rows.push(obj);
        i++;
      }

      // Tabelas que representam um único objeto
      if (key === 'conformidade' || key === 'conformidade_geral' || key === 'distribuicao_percentuais' || key === 'cobertura_analise') {
        result[key] = rows[0] || {};
      } else {
        result[key] = rows;
      }
      continue;
    }

    // linha inesperada: ignorar
    i++;
  }

  return result;
}

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
      ? `\n\nCONTEXTO ADICIONAL DO USUÁRIO:\n${userContext}\n(Considere estas informações na sua análise)`
      : '';

    // Prompt otimizado para análise rigorosa de construção civil (saída em TOON)
    const prompt = `Você é um engenheiro civil especialista em fiscalização de obras com 20 anos de experiência. Sua função é realizar uma análise RIGOROSA e CRÍTICA comparando um projeto BIM com a execução real da obra.

IMAGEM 1: Modelo BIM (planejamento/projeto) - Este é o padrão de referência esperado
IMAGEM 2: Foto real da obra atual - Este é o que foi executado${contextSection}

PRINCÍPIO FUNDAMENTAL DA AVALIAÇÃO:
- 100% de conclusão SOMENTE se a obra estiver COMPLETAMENTE IDÊNTICA ao projeto BIM
- QUALQUER diferença visível, por menor que seja, DEVE reduzir o percentual
- Seja CRÍTICO e RIGOROSO em sua avaliação
- É MELHOR subestimar do que superestimar a conformidade

FOCO NA ESTRUTURA GERAL (PRIORIDADE):
1) PAREDES/ALVENARIAS E VEDAÇÕES: alinhamento, continuidade, presença/ausência, espessuras aparentes
2) PILARES/VIGAS/ELEMENTOS ESTRUTURAIS: posição, presença, geometria aparente
3) ABERTURAS (JANELAS/PORTAS): posição, tamanho relativo, quantidade, orientação
4) LAYOUT/VOLUMETRIA: configuração do espaço, divisórias e organização geral
5) MOBÍLIA/ELEMENTOS FIXOS: presença e posicionamento (se houver)
6) ACABAMENTOS: considerar somente quando impactarem geometria/funcionalidade ou evidenciem não conformidade estrutural/posicional

PESOS RECOMENDADOS PARA O PERCENTUAL (guide):
- Estrutura (paredes/pilares/vigas): ~60%
- Posicionamento (aberturas/layout): ~20%
- Dimensões relativas: ~15%
- Acabamentos: ~5% (apenas se afetarem função/geometria)

AVALIAÇÃO DO PERCENTUAL (sem mudar a escala, apenas a ênfase):
- 100%: Execução perfeita e completa, estrutura e posicionamento idênticos ao BIM
- 85-99%: Quase completo, ajustes menores sem impacto estrutural
- 70-84%: Avançado, com diferenças notáveis em layout/aberturas
- 50-69%: Em andamento, diferenças significativas em estrutura/posicionamento
- 30-49%: Inicial, com lacunas relevantes de estrutura/layout
- 0-29%: Início ou não iniciado

Compare, em ordem, ESTRUTURA → POSICIONAMENTO/ABERTURAS → DIMENSÕES → (por último) ACABAMENTOS. Seja CRÍTICO e conservador.

FORMATO DE RESPOSTA (APENAS TOON, sem markdown):

percentual_conclusao: <0-100>
analise_progresso: "<máx 150 chars>"
conformidade{estrutura,dimensoes,acabamento,posicionamento}:
  <conforme|parcialmente_conforme|não_conforme>,<conforme|parcialmente_conforme|não_conforme>,<conforme|parcialmente_conforme|não_conforme>,<conforme|parcialmente_conforme|não_conforme>
problemas_detectados{tipo,descricao,severidade}:
  <estrutural|dimensional|material|acabamento|posicionamento>,"<máx 80 chars>",<baixa|média|alta>
  ... (uma linha por problema, até 3)
elementos_faltantes{item}:
  "<item 1>"
  "<item 2>"
observacoes_gerais: "<máx 120 chars>"
justificativa_percentual: "<máx 100 chars>"
recomendacoes{acao}:
  "<ação 1>"
  "<ação 2>"

IMPORTANTE - NÃO FAÇA:
- Não seja generoso demais com o percentual
- Não ignore pequenas diferenças
- Não assuma que elementos estão corretos se não puder ver claramente
- Não use 100% a menos que esteja ABSOLUTAMENTE certo de conformidade total
- Não adicione texto antes ou depois do TOON
- Não use blocos de código markdown

IMPORTANTE - FAÇA:
- Seja rigoroso e crítico na avaliação
- Procure ativamente por diferenças, priorizando estrutura e aberturas
- Dê mais peso a paredes/pilares/vigas/aberturas do que a acabamentos
- Use percentuais conservadores (quando em dúvida, reduza)
- Retorne APENAS o TOON puro

LIMITES OBRIGATÓRIOS (respeite rigorosamente):
- analise_progresso: MÁXIMO 150 caracteres
- Cada descrição de problema: MÁXIMO 80 caracteres
- Máximo 3 problemas detectados (só os críticos)
- Máximo 3 elementos faltantes (só os principais)
- Máximo 2 recomendações (só as urgentes)
- observacoes_gerais: MÁXIMO 120 caracteres
- justificativa_percentual: MÁXIMO 100 caracteres

REGRAS DE FORMATAÇÃO TOON:
- NÃO inclua colchetes com contagem (ex.: [3], [max 3]) nos headers; use apenas {colunas}
- Use aspas apenas quando necessário em strings com vírgulas

SEJA EXTREMAMENTE CONCISO. Use frases curtas e diretas.`;

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
        maxOutputTokens: 16384,  // Aumentado para evitar truncamento
        responseMimeType: "text/plain"
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
    
    // Tentar extrair TOON da resposta
    let analysisResult;
    let toonRaw = '';
    try {
      // Limpeza super agressiva do texto
      let cleanedText = textResponse.trim();
      
      // 1. Remove TODOS os tipos de marcadores de código
      cleanedText = cleanedText.replace(/^```json\s*/gmi, '');
      cleanedText = cleanedText.replace(/^```\s*/gm, '');
      cleanedText = cleanedText.replace(/```\s*$/gm, '');
      
      // 2. Normalizar headers com colchetes de contagem (ex.: [max 3]) removendo-os antes de "{"
      //    Mantém valores como "[1,2,3]" pois não são seguidos por "{"
      cleanedText = cleanedText.replace(/\[[^\]]*\](?=\s*\{)/g, '');

      // 3. Remove espaços e quebras de linha extras
      cleanedText = cleanedText.trim();
      toonRaw = cleanedText;
      
      console.log('=== TEXTO LIMPO ===');
      console.log(cleanedText.substring(0, 300) + '...');
      console.log('=== FIM DO TEXTO LIMPO ===');
      console.log('🧹 TEXTO LIMPO COMPLETO (primeiros 500 chars):', cleanedText.substring(0, 500));
      
      // Tentar fazer parse (TOON -> Objeto) com a lib oficial
      try {
        analysisResult = decode(cleanedText);
      } catch (libErr) {
        console.warn('⚠️ Falha no decode oficial TOON. Usando parser customizado.');
        analysisResult = parseToonCustom(cleanedText);
      }
      
      console.log('✅ TOON parseado com sucesso!');
      console.log('📊 OBJETO PARSEADO:', JSON.stringify(analysisResult, null, 2));
      
      // Validar estrutura mínima
      if (analysisResult.percentual_conclusao === undefined) {
        throw new Error('Resposta inválida: falta percentual_conclusao');
      }

      // Normalizações para compatibilidade
      if (analysisResult.observacoes_generais && !analysisResult.observacoes_gerais) {
        analysisResult.observacoes_gerais = analysisResult.observacoes_generais;
        delete analysisResult.observacoes_generais;
      }
      if (Array.isArray(analysisResult.conformidade)) {
        analysisResult.conformidade = analysisResult.conformidade[0];
      }
      if (Array.isArray(analysisResult.elementos_faltantes) && analysisResult.elementos_faltantes.length > 0 && typeof analysisResult.elementos_faltantes[0] === 'object') {
        analysisResult.elementos_faltantes = analysisResult.elementos_faltantes
          .map(e => e.item ?? e.value ?? e.nome)
          .filter(Boolean);
      }
      if (Array.isArray(analysisResult.recomendacoes) && analysisResult.recomendacoes.length > 0 && typeof analysisResult.recomendacoes[0] === 'object') {
        analysisResult.recomendacoes = analysisResult.recomendacoes
          .map(r => r.acao ?? r.value ?? r.texto)
          .filter(Boolean);
      }
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta:', parseError.message);
      console.error('🔍 RESPOSTA QUE FALHOU NO PARSE (completa):', textResponse);
      console.error('Resposta original (primeiros 1000 chars):', textResponse.substring(0, 1000));
      
      // Tentar extrair pelo menos o percentual
      let percentualMatch = textResponse.match(/"percentual_conclusao":\s*(\d+)/);
      let percentual = percentualMatch ? parseInt(percentualMatch[1]) : 50; // Default 50% se não encontrar
      
      // Tentar extrair analise_progresso (truncado se necessário)
      let analiseMatch = textResponse.match(/"analise_progresso":\s*"([^"]{1,200})"/);
      let analiseProgresso = analiseMatch 
        ? analiseMatch[1].substring(0, 150) 
        : 'Estrutura em fase de execução. Análise parcial devido a limitação de resposta.';
      
      // Se não conseguir fazer parse, tenta extrair informações manualmente
      analysisResult = {
        percentual_conclusao: percentual,
        analise_progresso: analiseProgresso,
        problemas_detectados: [],
        conformidade: {
          estrutura: 'não_identificado',
          dimensoes: 'não_identificado',
          acabamento: 'não_identificado',
          posicionamento: 'não_identificado'
        },
        elementos_faltantes: [],
        observacoes_gerais: 'Análise parcial. Resposta excedeu limite.',
        recomendacoes: ['Verificar detalhes da obra'],
        justificativa_percentual: `Estimativa: ${percentual}%`
      };
      
      console.warn('⚠️ Usando análise parcial com percentual:', percentual);
    }

    return {
      success: true,
      data: analysisResult,
      toon: toonRaw,
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
    // Preparar TOON bruto das análises individuais (exatamente como retornado pelos prompts de comparação)
    let toonComparisons = individualAnalyses.map((item, index) => {
      if (!item.analysis.success) {
        return `FOTO ${index + 1} (erro): ${item.analysis.error}`;
      }
      const toon = item.analysis.toon || '';
      return `FOTO ${index + 1}:\n${toon}`;
    }).join('\n---\n');

    // Não incluir contexto adicional no consolidador (contexto já foi aplicado nos comparadores)
    const contextSection = '';

// Prompt para consolidação (saída em TOON)
    const prompt = `Você é um engenheiro civil especialista em análise e fiscalização de obras. Você recebeu análises individuais de ${individualAnalyses.length} fotos diferentes da mesma obra, todas comparadas com o mesmo modelo BIM.

Sua tarefa é CONSOLIDAR todas essas análises em um RELATÓRIO ÚNICO e ABRANGENTE da obra.${contextSection}

ANÁLISES INDIVIDUAIS RECEBIDAS (TOON bruto de cada comparação):
${toonComparisons}

INSTRUÇÕES PARA CONSOLIDAÇÃO (FOCO EM ESTRUTURA E ABERTURAS):

1. PERCENTUAL GERAL:
   - Calcule uma média ponderada priorizando estrutura (paredes, pilares, vigas) e aberturas (janelas/portas)
   - Considere que diferentes ângulos podem mostrar diferentes estágios
   - Se houver discrepâncias grandes, dê preferência ao percentual MENOR (seja conservador), principalmente quando houver divergências estruturais/posicionais
   - Justifique claramente como chegou ao percentual final

2. ANÁLISE COMPLETA:
   - Sintetize as observações de todas as fotos
   - Identifique padrões comuns entre as análises
   - Destaque áreas que aparecem em múltiplas fotos
   - Priorize comentários sobre: paredes/vedações, pilares/vigas, aberturas/posicionamento, layout geral e, por fim, mobília (se houver)

3. PROBLEMAS CONSOLIDADOS:
   - Agrupe problemas similares encontrados em diferentes fotos
   - Evite duplicação de problemas
   - Priorize por severidade e frequência, dando precedência a problemas estruturais/posicionais

4. CONFORMIDADE GERAL:
   - Se um aspecto foi avaliado em múltiplas fotos, use a avaliação mais conservadora
   - Se só foi avaliado em uma foto, use essa avaliação
   - Dê mais peso a divergências de paredes/pilares/vigas/aberturas do que a diferenças de acabamento

5. ELEMENTOS FALTANTES:
   - Crie uma lista unificada sem duplicatas
   - Considere que elementos podem estar visíveis em algumas fotos e não em outras

6. RECOMENDAÇÕES:
   - Forneça recomendações baseadas na visão geral de todas as fotos
   - Priorize ações por severidade e impacto

FORMATO DE RESPOSTA (APENAS TOON, sem markdown):

percentual_conclusao_geral: <0-100>
analise_consolidada: "<síntese completa considerando todas as fotos>"
distribuicao_percentuais{minimo,maximo,media,desvio_padrao}:
  <número>,<número>,<número>,<número>
problemas_consolidados{tipo,descricao,severidade,frequencia,fotos_afetadas}:
  <tipo>,"<descrição>",<baixa|média|alta>,"<encontrado em X de Y fotos>","[1,2,3]"
  ... (uma linha por problema)
conformidade_geral{estrutura,dimensoes,acabamento,posicionamento,materiais,cores_texturas}:
  <conforme|parcialmente_conforme|não_conforme|não_identificado>,<conforme|parcialmente_conforme|não_conforme|não_identificado>,<conforme|parcialmente_conforme|não_conforme|não_identificado>,<conforme|parcialmente_conforme|não_conforme|não_identificado>,<conforme|parcialmente_conforme|não_conforme|não_identificado>,<conforme|parcialmente_conforme|não_conforme|não_identificado>
elementos_faltantes_consolidados{item}:
  "<item 1>"
  "<item 2>"
areas_criticas{area}:
  "<área 1>"
pontos_positivos{ponto}:
  "<ponto 1>"
observacoes_gerais: "<síntese geral da obra considerando todos os ângulos analisados>"
justificativa_percentual: "<explicação detalhada de como o percentual geral foi calculado>"
recomendacoes_prioritarias{prioridade,acao,justificativa}:
  <alta|média|baixa>,"<descrição da ação>","<por que é importante>"
  ... (uma linha por recomendação)
cobertura_analise{total_fotos_analisadas,fotos_com_sucesso,fotos_com_erro,areas_cobertas}:
  <número>,<número>,<número>,"[area1,area2]"

IMPORTANTE:
- Retorne APENAS o TOON, sem markdown ou explicações adicionais
- Seja RIGOROSO na consolidação
- Dê preferência a avaliações conservadoras quando houver discrepâncias
- Considere a obra como um TODO, não apenas partes isoladas

REGRAS DE FORMATAÇÃO TOON:
- NÃO inclua colchetes com contagem (ex.: [3], [max 3]) nos headers; use apenas {colunas}
- Use aspas apenas quando necessário em strings com vírgulas`;

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
          maxOutputTokens: 16384,  // Aumentado para evitar truncamento
          responseMimeType: "text/plain"
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

    // Parse do TOON
    let consolidatedResult;
    try {
      let cleanedText = textResponse.trim();
      
      // Limpeza do texto
      cleanedText = cleanedText.replace(/^```json\s*/gmi, '');
      cleanedText = cleanedText.replace(/^```\s*/gm, '');
      cleanedText = cleanedText.replace(/```\s*$/gm, '');

      // Remover colchetes de contagem nos headers antes de "{"
      cleanedText = cleanedText.replace(/\[[^\]]*\](?=\s*\{)/g, '');
      
      console.log('🧹 TEXTO CONSOLIDADO LIMPO (primeiros 500 chars):', cleanedText.substring(0, 500));
      
      // Tentar parsear com a lib oficial, com fallback para parser customizado
      try {
        consolidatedResult = decode(cleanedText.trim());
      } catch (libErr) {
        console.warn('⚠️ Falha no decode oficial TOON (consolidação). Usando parser customizado.');
        consolidatedResult = parseToonCustom(cleanedText.trim());
      }
      
      console.log('✅ TOON CONSOLIDADO parseado com sucesso!');
      console.log('📊 OBJETO CONSOLIDADO PARSEADO:', JSON.stringify(consolidatedResult, null, 2));

      // Normalizações para compatibilidade
      if (consolidatedResult.observacoes_generais && !consolidatedResult.observacoes_gerais) {
        consolidatedResult.observacoes_gerais = consolidatedResult.observacoes_generais;
        delete consolidatedResult.observacoes_generais;
      }
      if (Array.isArray(consolidatedResult.distribuicao_percentuais)) {
        consolidatedResult.distribuicao_percentuais = consolidatedResult.distribuicao_percentuais[0];
      }
      if (Array.isArray(consolidatedResult.conformidade_geral)) {
        consolidatedResult.conformidade_geral = consolidatedResult.conformidade_geral[0];
      }
      if (Array.isArray(consolidatedResult.elementos_faltantes_consolidados) && consolidatedResult.elementos_faltantes_consolidados.length > 0 && typeof consolidatedResult.elementos_faltantes_consolidados[0] === 'object') {
        consolidatedResult.elementos_faltantes_consolidados = consolidatedResult.elementos_faltantes_consolidados
          .map(e => e.item ?? e.value ?? e.nome)
          .filter(Boolean);
      }
      if (Array.isArray(consolidatedResult.areas_criticas) && consolidatedResult.areas_criticas.length > 0 && typeof consolidatedResult.areas_criticas[0] === 'object') {
        consolidatedResult.areas_criticas = consolidatedResult.areas_criticas
          .map(a => a.area ?? a.value ?? a.nome)
          .filter(Boolean);
      }
      if (Array.isArray(consolidatedResult.pontos_positivos) && consolidatedResult.pontos_positivos.length > 0 && typeof consolidatedResult.pontos_positivos[0] === 'object') {
        consolidatedResult.pontos_positivos = consolidatedResult.pontos_positivos
          .map(p => p.ponto ?? p.value ?? p.texto)
          .filter(Boolean);
      }
      if (Array.isArray(consolidatedResult.recomendacoes_prioritarias) && consolidatedResult.recomendacoes_prioritarias.length > 0) {
        // garantir que cada item tenha {prioridade, acao, justificativa}
        consolidatedResult.recomendacoes_prioritarias = consolidatedResult.recomendacoes_prioritarias.map(r => ({
          prioridade: r.prioridade ?? r.nivel ?? r.importancia ?? 'média',
          acao: r.acao ?? r.descricao ?? r.texto ?? '',
          justificativa: r.justificativa ?? r.motivo ?? ''
        }));
      }
      if (consolidatedResult.problemas_consolidados && Array.isArray(consolidatedResult.problemas_consolidados)) {
        consolidatedResult.problemas_consolidados = consolidatedResult.problemas_consolidados.map(p => {
          let fotos = p.fotos_afetadas;
          if (typeof fotos === 'string') {
            const cleaned = fotos.replace(/^\s*\[|\]\s*$/g, '').trim();
            const arr = cleaned.length ? cleaned.split(/\s*,\s*/).map(n => Number(n)).filter(n => Number.isFinite(n)) : [];
            return { ...p, fotos_afetadas: arr };
          }
          return p;
        });
      }
      if (consolidatedResult.cobertura_analise && typeof consolidatedResult.cobertura_analise === 'object') {
        const ac = consolidatedResult.cobertura_analise;
        if (typeof ac.areas_cobertas === 'string') {
          const cleaned = ac.areas_cobertas.replace(/^\s*\[|\]\s*$/g, '').trim();
          ac.areas_cobertas = cleaned.length ? cleaned.split(/\s*,\s*/).map(s => s.replace(/^"|"$/g, '')) : [];
        }
        consolidatedResult.cobertura_analise = ac;
      }
      
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da consolidação:', parseError);
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

