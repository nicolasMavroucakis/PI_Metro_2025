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
      ? `\n\nCONTEXTO ADICIONAL DO USUÁRIO:\n${userContext}\n(Considere estas informações na sua análise)`
      : '';

    // Prompt otimizado para análise de construção civil
    const prompt = `Você é um especialista em análise de obras e construção civil. Compare essas duas imagens:

IMAGEM 1: Modelo BIM (planejamento/projeto)
IMAGEM 2: Foto real da obra${contextSection}

INSTRUÇÕES CRÍTICAS:
- Retorne APENAS um objeto JSON válido
- Não use blocos de código markdown
- Não adicione texto antes ou depois do JSON
- Não adicione explicações
- Comece sua resposta com { e termine com }

Faça uma análise detalhada e responda no seguinte formato JSON:

{
  "percentual_conclusao": <número de 0 a 100>,
  "analise_progresso": "<descrição clara do que foi executado e o que falta>",
  "problemas_detectados": [
    {
      "tipo": "<tipo do problema>",
      "descricao": "<descrição detalhada>",
      "severidade": "<baixa|média|alta>"
    }
  ],
  "conformidade": {
    "estrutura": "<conforme|não_conforme|não_identificado>",
    "dimensoes": "<conforme|não_conforme|não_identificado>",
    "acabamento": "<conforme|não_conforme|não_identificado>",
    "posicionamento": "<conforme|não_conforme|não_identificado>"
  },
  "observacoes_gerais": "<observações importantes sobre a comparação>",
  "recomendacoes": [
    "<recomendação 1>",
    "<recomendação 2>"
  ]
}

Critérios para análise:
1. Compare elementos estruturais visíveis
2. Avalie o progresso da construção
3. Identifique desvios do planejamento
4. Detecte problemas de qualidade ou segurança
5. Considere proporções e dimensões relativas
6. Seja específico e objetivo`;

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
        temperature: 0.2,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
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

    // Extrair o texto da resposta
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Nenhuma resposta foi gerada pela IA');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    
    console.log('=== RESPOSTA ORIGINAL DA IA ===');
    console.log(textResponse);
    console.log('=== FIM DA RESPOSTA ===');
    
    // Tentar extrair JSON da resposta
    let analysisResult;
    try {
      // Limpeza super agressiva do texto
      let cleanedText = textResponse.trim();
      
      // 1. Remove TODOS os tipos de marcadores de código
      cleanedText = cleanedText.replace(/^```json\s*/gmi, '');
      cleanedText = cleanedText.replace(/^```\s*/gm, '');
      cleanedText = cleanedText.replace(/```\s*$/gm, '');
      
      // 2. Remove qualquer texto explicativo antes do JSON
      // Procura pelo primeiro { que inicia o JSON
      const jsonStartIndex = cleanedText.indexOf('{');
      if (jsonStartIndex > 0) {
        cleanedText = cleanedText.substring(jsonStartIndex);
      }
      
      // 3. Remove qualquer texto explicativo depois do JSON
      // Procura pelo último } que fecha o JSON
      const jsonEndIndex = cleanedText.lastIndexOf('}');
      if (jsonEndIndex > 0 && jsonEndIndex < cleanedText.length - 1) {
        cleanedText = cleanedText.substring(0, jsonEndIndex + 1);
      }
      
      // 4. Remove espaços e quebras de linha extras
      cleanedText = cleanedText.trim();
      
      console.log('=== TEXTO LIMPO ===');
      console.log(cleanedText.substring(0, 300) + '...');
      console.log('=== FIM DO TEXTO LIMPO ===');
      
      // Tentar fazer parse
      analysisResult = JSON.parse(cleanedText);
      
      console.log('✅ JSON parseado com sucesso!');
      
      // Validar estrutura mínima
      if (analysisResult.percentual_conclusao === undefined) {
        throw new Error('JSON inválido: falta percentual_conclusao');
      }
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse da resposta:', parseError.message);
      console.error('Resposta original:', textResponse);
      
      // Tentar extrair pelo menos o percentual
      let percentualMatch = textResponse.match(/"percentual_conclusao":\s*(\d+)/);
      let percentual = percentualMatch ? parseInt(percentualMatch[1]) : 0;
      
      // Se não conseguir fazer parse, tenta extrair informações manualmente
      analysisResult = {
        percentual_conclusao: percentual,
        analise_progresso: textResponse,
        problemas_detectados: [],
        conformidade: {
          estrutura: 'não_identificado',
          dimensoes: 'não_identificado',
          acabamento: 'não_identificado',
          posicionamento: 'não_identificado'
        },
        observacoes_gerais: 'A análise foi realizada, mas o formato da resposta não pôde ser processado corretamente. Veja os detalhes no campo "Análise de Progresso".',
        recomendacoes: ['Tente novamente com imagens mais claras', 'Certifique-se de que ambas as imagens mostram o mesmo ângulo']
      };
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
  isConfigured,
  testConnection
};

export default vertexAIService;

