# Sistema de Documentos - Mobile

## Visão Geral

A aba "Documentos" do app mobile Metro SP - Obras permite que os usuários gerenciem documentos da obra de forma organizada, com navegação por pastas e upload de arquivos diretamente do dispositivo móvel.

## Funcionalidades Implementadas

### 📱 Seleção de Projeto
- **Lista de Projetos**: Visualiza todos os projetos disponíveis
- **Navegação**: Toque em um projeto para acessar seus documentos
- **Interface Intuitiva**: Cards com informações básicas do projeto

### 📁 Navegação de Pastas
- **Estrutura Hierárquica**: Sistema de pastas similar ao explorador de arquivos
- **Breadcrumb**: Navegação visual mostrando o caminho atual
- **Voltar**: Botão para retornar à pasta anterior ou lista de projetos

### 📤 Upload de Documentos
- **Seleção de Arquivos**: Integração com o sistema de arquivos do dispositivo
- **Tipos Suportados**: Todos os tipos de arquivo (PDF, DOC, XLS, imagens, etc.)
- **Progresso Visual**: Barra de progresso durante o upload
- **Feedback**: Confirmação de sucesso ou erro

### 🗂️ Gerenciamento de Pastas
- **Criar Pastas**: Modal para criação de novas pastas
- **Organização**: Estrutura de pastas personalizável
- **Navegação**: Toque para entrar em pastas

### 📄 Visualização de Arquivos
- **Informações**: Nome, tamanho, data de modificação
- **Ícones**: Ícones específicos por tipo de arquivo
- **Detalhes**: Modal com informações completas do arquivo

## Como Usar

### 1. Acessar Documentos
1. Abra o app e vá para a aba "**Documentos**"
2. Selecione um projeto da lista
3. Você verá a estrutura de pastas e arquivos do projeto

### 2. Navegar pelas Pastas
1. **Entrar em pasta**: Toque em qualquer pasta para abrir
2. **Voltar**: Use o botão "← Voltar" no cabeçalho
3. **Breadcrumb**: Toque em qualquer item do caminho para navegar rapidamente

### 3. Criar Nova Pasta
1. Toque no botão "**📁 Pasta**" no cabeçalho
2. Digite o nome da nova pasta
3. Toque em "**Criar**"
4. A pasta será criada na localização atual

### 4. Fazer Upload de Documentos
1. Toque no botão "**📤 Upload**" no cabeçalho
2. Selecione o arquivo desejado do dispositivo
3. Acompanhe o progresso do upload
4. O arquivo aparecerá na pasta atual após o upload

### 5. Visualizar Informações do Arquivo
1. Toque em qualquer arquivo
2. Veja informações como:
   - Nome completo
   - Tamanho do arquivo
   - Data de modificação
3. Opção "Abrir" (funcionalidade futura)

## Estrutura de Arquivos no S3

Os documentos são organizados da seguinte forma:
```
s3://metrosp2025maua/
├── projeto-nome/
│   └── documentos/
│       ├── contratos/
│       │   ├── 2024/
│       │   │   ├── contrato-principal.pdf
│       │   │   └── aditivos/
│       │   │       └── aditivo-01.pdf
│       │   └── fornecedores/
│       ├── plantas/
│       │   ├── arquitetonicas/
│       │   └── estruturais/
│       ├── licencas/
│       └── relatorios/
```

## Tipos de Arquivo Suportados

### 📄 Documentos
- **PDF**: Contratos, relatórios, manuais
- **DOC/DOCX**: Documentos Word
- **TXT**: Arquivos de texto
- **RTF**: Rich Text Format

### 📊 Planilhas
- **XLS/XLSX**: Planilhas Excel
- **CSV**: Dados tabulares

### 📽️ Apresentações
- **PPT/PPTX**: Apresentações PowerPoint

### 🖼️ Imagens
- **JPG/JPEG**: Fotos e imagens
- **PNG**: Imagens com transparência
- **GIF**: Imagens animadas
- **BMP/SVG**: Outros formatos de imagem

### 🎥 Multimídia
- **MP4/AVI/MOV**: Vídeos
- **MP3/WAV**: Áudios

### 📦 Arquivos Compactados
- **ZIP/RAR/7Z**: Arquivos comprimidos

### 📐 CAD/Desenho
- **DWG/DXF**: Arquivos AutoCAD

## Tecnologias Utilizadas

- **React Native**: Framework principal
- **Expo**: Plataforma de desenvolvimento
- **Expo Document Picker**: Seleção de documentos
- **AWS SDK**: Integração com serviços AWS
- **Amazon S3**: Armazenamento de documentos
- **DynamoDB**: Banco de dados de projetos

## Recursos de UX/UI

### Design
- **Interface Consistente**: Mesmo padrão visual do resto do app
- **Ícones Intuitivos**: Ícones específicos para cada tipo de arquivo
- **Feedback Visual**: Estados de loading, progresso e confirmações
- **Navegação Clara**: Breadcrumb e botões de navegação

### Interações
- **Pull-to-refresh**: Atualizar listas
- **Modal de Criação**: Interface limpa para criar pastas
- **Progresso de Upload**: Acompanhamento visual do envio
- **Alertas Informativos**: Confirmações e mensagens de erro

### Organização
- **Hierarquia Visual**: Pastas e arquivos claramente diferenciados
- **Ordenação**: Pastas primeiro, depois arquivos (alfabética)
- **Informações Contextuais**: Tamanho, data e tipo de arquivo

## Compatibilidade com Web

O sistema mobile é **100% compatível** com a versão web:
- **Mesma estrutura**: Pastas e arquivos sincronizados
- **Caminhos idênticos**: Usa os mesmos paths no S3
- **Metadados consistentes**: Informações de upload e modificação
- **Interoperabilidade**: Arquivos enviados no mobile aparecem no web e vice-versa

## Limitações Atuais

- **Visualização**: Arquivos não podem ser visualizados diretamente no app
- **Download**: Funcionalidade de download não implementada
- **Seleção Múltipla**: Upload de um arquivo por vez
- **Exclusão**: Funcionalidade de deletar não implementada

## Próximos Passos

Possíveis melhorias futuras:
- [ ] Visualização de PDFs e imagens no app
- [ ] Download de arquivos para o dispositivo
- [ ] Upload múltiplo de arquivos
- [ ] Funcionalidade de exclusão de arquivos/pastas
- [ ] Busca por nome de arquivo
- [ ] Filtros por tipo de arquivo
- [ ] Compartilhamento de arquivos
- [ ] Sincronização offline
- [ ] Compressão automática de uploads
- [ ] Histórico de modificações

## Suporte

Para dúvidas ou problemas:
1. Verifique a conexão com internet
2. Confirme se o projeto existe
3. Tente fazer pull-to-refresh nas listas
4. Reinicie o app se necessário
5. Verifique se há espaço suficiente no dispositivo para uploads
