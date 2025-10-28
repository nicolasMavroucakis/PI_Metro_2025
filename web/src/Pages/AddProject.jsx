import React, { useState } from 'react';
import Layout from '../components/Layout';
import '../Style/AddProject.css';
import projectService from '../services/projectService';

function AddProject() {
  const [formData, setFormData] = useState({
    projectName: '',
    startDate: '',
    endDate: '',
    status: '',
    projectImage: null
  });

  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', active: true, path: '/add-project' }
  ];

  const statusOptions = [
    { value: '', label: 'Selecione o status' },
    { value: 'planejamento', label: 'Em Planejamento' },
    { value: 'andamento', label: 'Em Andamento' },
    { value: 'pausado', label: 'Pausado' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar mensagens quando usuário começar a digitar
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        projectImage: file
      }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFormData(prev => ({
        ...prev,
        projectImage: file
      }));
    }
  };

  const validateForm = () => {
    if (!formData.projectName.trim()) {
      setError('Nome do projeto é obrigatório');
      return false;
    }
    
    if (!formData.startDate) {
      setError('Data de início é obrigatória');
      return false;
    }
    
    if (!formData.endDate) {
      setError('Data de término é obrigatória');
      return false;
    }
    
    if (!formData.status) {
      setError('Status do projeto é obrigatório');
      return false;
    }

    // Validar se data de término é posterior à data de início
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('Data de término deve ser posterior à data de início');
      return false;
    }

    // Validar arquivo de imagem se fornecido
    if (formData.projectImage) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(formData.projectImage.type)) {
        setError('Formato de imagem não suportado. Use JPG, PNG ou WebP');
        return false;
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (formData.projectImage.size > maxSize) {
        setError('Imagem muito grande. Tamanho máximo: 5MB');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // Criar projeto
      const result = await projectService.createProject({
        projectName: formData.projectName.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        projectImage: formData.projectImage
      });
      
      if (result.success) {
        setSuccess('Projeto criado com sucesso!');
        
        // Reset do formulário após sucesso
        setTimeout(() => {
          setFormData({
            projectName: '',
            startDate: '',
            endDate: '',
            status: '',
            projectImage: null
          });
          setSuccess('');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    document.getElementById('file-input').click();
  };

  return (
    <Layout menuItems={menuItems}>
      <header className="page-header">
        <h1>Projetos</h1>
      </header>
      
      <main className="add-project-main">
        <div className="add-project-container">
          <div className="add-project-header">
            <h2>Adicionar Projeto</h2>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form className="add-project-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="projectName" className="form-label">
                  Nome do Projeto
                </label>
                <input
                  type="text"
                  id="projectName"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Digite o nome do projeto"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate" className="form-label">
                  Data de Início
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="form-input date-input"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="endDate" className="form-label">
                  Data de Término
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="form-input date-input"
                  min={formData.startDate}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                  disabled={loading}
                  required
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Imagem do Projeto</label>
              <div 
                className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <input
                  type="file"
                  id="file-input"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                <div className="upload-content">
                  <div className="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17,8 12,3 7,8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  
                  {formData.projectImage ? (
                    <div className="file-selected">
                      <p className="file-name">{formData.projectImage.name}</p>
                      <p className="file-size">
                        {(formData.projectImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="upload-text">
                        Arraste e solte para fazer upload de arquivo
                      </p>
                      <p className="upload-or">ou</p>
                      <button type="button" className="upload-button">
                        Procurar Arquivo
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Criando Projeto...' : 'Criar Projeto'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </Layout>
  );
}

export default AddProject;
