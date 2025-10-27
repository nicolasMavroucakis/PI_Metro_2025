# 🤖 Comparação BIM com IA - Vertex AI (Google Gemini)

Sistema de comparação inteligente entre modelos BIM (planejamento) e fotos reais da obra, utilizando a API do Google Gemini Vision para análise automatizada de progresso e conformidade.

---

## 📋 Índice

- [Sobre o Sistema](#sobre-o-sistema)
- [Funcionalidades](#funcionalidades)
- [Configuração](#configuração)
- [Como Usar](#como-usar)
- [Resultados da Análise](#resultados-da-análise)
- [Segurança](#segurança)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Sobre o Sistema

O sistema utiliza **Google Vertex AI** (modelo Gemini 1.5 Pro) para realizar análises inteligentes comparando:
- 📐 **Imagens de Modelos BIM**: Representações do projeto planejado
- 🏗️ **Fotos Reais da Obra**: Estado atual da construção

A IA analisa e fornece:
- Percentual de conclusão do projeto
- Análise de conformidade (estrutura, dimensões, acabamento, posicionamento)
- Detecção automática de problemas e anomalias
- Recomendações de ação

---

## ✨ Funcionalidades

### 1. **Seleção Intuitiva de Imagens**
- Visualização em grid de todas as fotos do projeto
- Separação automática por categoria (BIM vs Obra)
- Seleção visual com feedback imediato

### 2. **Análise Inteligente com IA**
- Comparação automática de imagens
- Análise de progresso (0-100%)
- Avaliação de conformidade em múltiplos aspectos
- Detecção de problemas com níveis de severidade

### 3. **Relatório Completo**
- Dashboard visual com gráficos
- Lista detalhada de problemas encontrados
- Observações e recomendações personalizadas
- Comparação lado a lado das imagens

---

## ⚙️ Configuração

### 1. **Obter Chave de API do Google**

1. Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie sua chave de API

### 2. **Configurar o Projeto**

1. Navegue até o diretório `web/`
2. Crie ou edite o arquivo `.env`:

```bash
# Copie o exemplo de configuração
cp env.example .env
```

3. Adicione sua chave de API no arquivo `.env`:

```env
# Google Vertex AI / Gemini
REACT_APP_GOOGLE_API_KEY=sua_chave_api_aqui
```

### 3. **Instalar Dependências (se necessário)**

```bash
cd web
npm install
```

### 4. **Iniciar o Sistema**

```bash
npm start
```

---

## 🚀 Como Usar

### Passo 1: Acessar a Página de Comparação

1. Acesse um projeto na plataforma
2. Clique no botão **🤖 Comparação IA** no cabeçalho

### Passo 2: Adicionar Fotos ao Projeto

**Antes de fazer a comparação**, certifique-se de ter:
- ✅ Pelo menos 1 foto do modelo BIM (categoria: Fotos do BIM)
- ✅ Pelo menos 1 foto real da obra (categoria: Fotos da Obra)

Para adicionar fotos:
1. Volte à página do projeto
2. Clique em "Nova Captura"
3. Selecione a categoria apropriada
4. Faça upload das imagens

### Passo 3: Selecionar Imagens para Comparar

1. **Selecione uma foto do BIM** (lado esquerdo)
   - Clique na imagem desejada
   - A imagem selecionada ficará destacada com borda azul

2. **Selecione uma foto da obra** (lado direito)
   - Clique na imagem desejada
   - A imagem selecionada ficará destacada com borda azul

### Passo 4: Realizar a Comparação

1. Clique no botão **🚀 Comparar com IA**
2. Aguarde o processamento (pode levar 10-30 segundos)
3. Os resultados aparecerão automaticamente abaixo

### Passo 5: Analisar os Resultados

Os resultados incluem:

#### 📈 **Progresso da Obra**
- Gráfico circular mostrando o percentual concluído
- Descrição detalhada do que foi executado

#### ✅ **Análise de Conformidade**
- **Estrutura**: Verificação dos elementos estruturais
- **Dimensões**: Conformidade com as medidas planejadas
- **Acabamento**: Qualidade dos acabamentos
- **Posicionamento**: Alinhamento e posição dos elementos

Status possíveis:
- ✅ **Conforme**: Está de acordo com o planejado
- ❌ **Não Conforme**: Apresenta desvios
- ❓ **Não Identificado**: Não foi possível avaliar

#### ⚠️ **Problemas e Anomalias**
Lista de problemas detectados com:
- **Tipo**: Categoria do problema
- **Descrição**: Detalhamento do que foi encontrado
- **Severidade**: Baixa (🟢), Média (🟡) ou Alta (🔴)

#### 💡 **Recomendações**
Sugestões de ações corretivas baseadas na análise

---

## 📊 Resultados da Análise

### Exemplo de Análise

```json
{
  "percentual_conclusao": 75,
  "analise_progresso": "A estrutura principal está 75% concluída. As paredes externas estão finalizadas, mas o acabamento interno ainda está em progresso.",
  "problemas_detectados": [
    {
      "tipo": "Desvio de Alinhamento",
      "descricao": "Parede norte apresenta leve desvio em relação ao projeto original",
      "severidade": "média"
    }
  ],
  "conformidade": {
    "estrutura": "conforme",
    "dimensoes": "conforme",
    "acabamento": "não_conforme",
    "posicionamento": "conforme"
  },
  "observacoes_gerais": "A obra está progredindo conforme o planejado, com pequenos desvios que necessitam correção.",
  "recomendacoes": [
    "Verificar alinhamento da parede norte",
    "Acelerar o ritmo de acabamento interno"
  ]
}
```

---

## 🔒 Segurança

### ⚠️ IMPORTANTE: Proteção da Chave de API

**NUNCA compartilhe sua chave de API publicamente!**

✅ **Boas Práticas:**
- Mantenha a chave no arquivo `.env` (nunca no código)
- Adicione `.env` ao `.gitignore`
- Revogue chaves expostas imediatamente
- Use chaves diferentes para desenvolvimento e produção

❌ **Evite:**
- Commitar o arquivo `.env` no Git
- Compartilhar chaves em chats/emails
- Colocar chaves diretamente no código

### Revogar uma Chave Exposta

Se você acidentalmente expôs sua chave:
1. Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Localize a chave comprometida
3. Clique em "Delete"
4. Gere uma nova chave
5. Atualize seu arquivo `.env`

---

## 🔧 Troubleshooting

### Problema: "Chave de API não configurada"

**Solução:**
1. Verifique se o arquivo `.env` existe na pasta `web/`
2. Confirme que a variável está nomeada: `REACT_APP_GOOGLE_API_KEY`
3. Reinicie o servidor após editar o `.env`:
   ```bash
   # Pare o servidor (Ctrl+C)
   npm start  # Inicie novamente
   ```

### Problema: "Erro na API do Google: 403"

**Possíveis causas:**
- Chave de API inválida ou revogada
- Chave não tem permissões para usar o Gemini

**Solução:**
1. Verifique se a chave está correta
2. Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Gere uma nova chave se necessário

### Problema: "Nenhuma resposta foi gerada pela IA"

**Possíveis causas:**
- Imagens muito grandes
- Formato de imagem não suportado
- Conteúdo das imagens bloqueado por filtros de segurança

**Solução:**
1. Tente usar imagens menores (recomendado: < 5MB)
2. Formatos suportados: JPG, PNG, WebP
3. Evite imagens com conteúdo sensível

### Problema: Análise não está precisa

**Dicas para melhorar a qualidade:**
- Use fotos com boa iluminação
- Capture ângulos similares entre BIM e foto real
- Evite fotos muito distantes ou muito próximas
- Certifique-se de que os elementos importantes estão visíveis

### Problema: Carregamento muito lento

**Soluções:**
- Reduza o tamanho das imagens antes do upload
- Verifique sua conexão com a internet
- A primeira análise pode demorar mais (API está "aquecendo")

---

## 📈 Limitações Conhecidas

- **Tamanho de Imagem**: Imagens muito grandes podem causar timeout
- **Quota da API**: O Google tem limites de requisições por minuto
- **Precisão da IA**: A análise é automatizada e pode não capturar nuances muito específicas
- **Idioma**: O sistema está otimizado para português brasileiro

---

## 🆘 Suporte

### Recursos Adicionais

- [Documentação oficial do Gemini](https://ai.google.dev/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Limites e quotas da API](https://ai.google.dev/pricing)

### Problemas Não Resolvidos?

Se você encontrou um problema não listado aqui:
1. Verifique os logs do console do navegador (F12 → Console)
2. Verifique os logs do servidor
3. Documente o erro e as etapas para reproduzi-lo

---

## 🚀 Próximos Passos

Recursos planejados para versões futuras:
- Comparação em lote (múltiplas fotos simultaneamente)
- Histórico de comparações
- Exportação de relatórios em PDF
- Detecção de elementos específicos (portas, janelas, etc.)
- Análise temporal (comparação do progresso ao longo do tempo)

---

## 📝 Notas de Versão

### v1.0.0 (Atual)
- ✅ Integração com Google Gemini Vision
- ✅ Comparação de imagens BIM vs Obra
- ✅ Análise de progresso e conformidade
- ✅ Detecção de problemas e anomalias
- ✅ Interface visual intuitiva
- ✅ Relatório completo com recomendações

---

**Desenvolvido com 💜 para o Projeto PI Metro 2025**

