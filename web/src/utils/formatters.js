export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getProgressColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'concluído':
    case 'concluido':
      return '#4CAF50'; // Verde
    case 'em andamento':
    case 'em_andamento':
      return '#FFEB3B'; // Amarelo
    case 'parado':
    case 'pausado':
      return '#F44336'; // Vermelho
    case 'planejamento':
      return '#2196F3'; // Azul
    default:
      return '#9E9E9E'; // Cinza
  }
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
