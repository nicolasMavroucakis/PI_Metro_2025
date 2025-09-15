import React, { useState } from 'react';
import Layout from '../components/Layout';
import '../Style/AddProject.css';

function AddProject() {
  const [formData, setFormData] = useState({
    projectName: '',
    startDate: '',
    endDate: '',
    status: '',
    projectImage: null
  });

  const [dragActive, setDragActive] = useState(false);

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', active: true, path: '/add-project' },
    { icon: '👤', label: 'Usuário', path: '/profile' }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.projectName.trim()) {
      alert('Por favor, insira o nome do projeto');
      return;
    }
    
    if (!formData.startDate) {
      alert('Por favor, selecione a data de início');
      return;
    }
    
    if (!formData.endDate) {
      alert('Por favor, selecione a data de término');
      return;
    }
    
    if (!formData.status) {
      alert('Por favor, selecione o status do projeto');
      return;
    }

    // Aqui você pode adicionar a lógica para salvar o projeto
    console.log('Dados do projeto:', formData);
    
    // Simular sucesso
    alert('Projeto adicionado com sucesso!');
    
    // Reset do formulário
    setFormData({
      projectName: '',
      startDate: '',
      endDate: '',
      status: '',
      projectImage: null
    });
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
              <button type="submit" className="submit-button">
                Próximo
              </button>
            </div>
          </form>
        </div>
      </main>
    </Layout>
  );
}

export default AddProject;
