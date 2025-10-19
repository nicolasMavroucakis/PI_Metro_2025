# Sistema de Fotos de Obra - Mobile

## Visão Geral

O app mobile Metro SP - Obras permite que os usuários visualizem projetos e gerenciem fotos de obra de forma simples e intuitiva.

## Funcionalidades Implementadas

### 📱 Tela Principal - Lista de Projetos
- **Visualização**: Lista todos os projetos ativos do sistema
- **Informações**: Nome, status, datas de início/término e descrição
- **Navegação**: Toque em qualquer projeto para ver suas fotos de obra
- **Atualização**: Pull-to-refresh para recarregar a lista

### 📸 Tela de Fotos de Obra
- **Visualização**: Grid de fotos organizadas por data (mais recentes primeiro)
- **Upload**: Adicionar novas fotos via câmera ou galeria
- **Visualização Completa**: Toque em qualquer foto para ver em tela cheia
- **Gerenciamento**: Excluir fotos diretamente do modal de visualização
- **Progresso**: Barra de progresso durante upload

## Como Usar

### 1. Visualizar Projetos
1. Abra o app
2. A tela principal mostra todos os projetos disponíveis
3. Cada card mostra:
   - Imagem do projeto (se disponível)
   - Nome e status
   - Datas de início e término
   - Descrição (se disponível)

### 2. Acessar Fotos de Obra
1. Toque em qualquer projeto da lista
2. Você será direcionado para a tela de fotos desse projeto
3. O cabeçalho mostra informações básicas do projeto

### 3. Adicionar Fotos
1. Na tela de fotos, toque no botão "**+ Adicionar**"
2. Escolha uma opção:
   - **Câmera**: Tirar uma nova foto
   - **Galeria**: Selecionar foto existente
3. A foto será processada e enviada automaticamente
4. Acompanhe o progresso na barra de upload

### 4. Visualizar Fotos
1. Toque em qualquer foto no grid
2. A foto abrirá em tela cheia
3. Veja informações como:
   - Nome do arquivo
   - Data de upload
   - Tamanho do arquivo

### 5. Excluir Fotos
1. Abra uma foto em tela cheia
2. Toque no botão "**🗑️ Excluir**"
3. Confirme a exclusão
4. A foto será removida permanentemente

## Permissões Necessárias

O app solicita as seguintes permissões:

- **📷 Câmera**: Para tirar fotos das obras
- **🖼️ Galeria**: Para selecionar fotos existentes

## Estrutura de Arquivos

### Serviços
- `services/projectService.js`: Gerencia operações com projetos e fotos

### Telas
- `app/(tabs)/index.tsx`: Lista de projetos
- `app/project-details.tsx`: Detalhes do projeto e fotos de obra

### Configuração
- `config/credentials.js`: Credenciais AWS
- `app.json`: Configurações do app e permissões

## Tecnologias Utilizadas

- **React Native**: Framework principal
- **Expo**: Plataforma de desenvolvimento
- **Expo Router**: Navegação entre telas
- **Expo Image Picker**: Seleção e captura de imagens
- **AWS SDK**: Integração com serviços AWS
- **Amazon S3**: Armazenamento de imagens
- **DynamoDB**: Banco de dados de projetos

## Organização no S3

As fotos são organizadas da seguinte forma (compatível com o sistema web):
```
bucket/
├── projeto-nome/
│   └── fotos/
│       └── categoria1/
│           ├── foto-obra-2025-01-01T10-00-00.jpg
│           ├── foto-obra-2025-01-02T14-30-00.jpg
│           └── ...
```

**Nota**: O mobile utiliza especificamente a `categoria1` que corresponde a "Fotos da Obra" no sistema web, garantindo compatibilidade total entre as plataformas.

## Recursos de UX/UI

### Design
- **Interface limpa**: Foco na funcionalidade principal
- **Cores consistentes**: Azul Metro SP (#0066CC)
- **Feedback visual**: Loading states e progress bars
- **Responsivo**: Adapta-se a diferentes tamanhos de tela

### Interações
- **Pull-to-refresh**: Atualizar listas
- **Haptic feedback**: Resposta tátil em botões
- **Animações suaves**: Transições entre telas
- **Modal overlay**: Visualização de fotos em tela cheia

### Acessibilidade
- **Textos descritivos**: Labels claros em todos os elementos
- **Contraste adequado**: Cores que atendem padrões de acessibilidade
- **Tamanhos de toque**: Botões com área mínima recomendada

## Próximos Passos

Possíveis melhorias futuras:
- [ ] Filtros por data nas fotos
- [ ] Busca por projetos
- [ ] Modo offline com sincronização
- [ ] Compressão automática de imagens
- [ ] Geolocalização nas fotos
- [ ] Comentários nas fotos
- [ ] Compartilhamento de fotos
- [ ] Backup automático

## Suporte

Para dúvidas ou problemas:
1. Verifique se as permissões estão concedidas
2. Confirme conexão com internet
3. Tente fazer pull-to-refresh nas listas
4. Reinicie o app se necessário
