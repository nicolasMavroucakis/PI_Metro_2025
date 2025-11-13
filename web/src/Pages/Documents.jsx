import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import documentService from '../services/documentService';
import projectService from '../services/projectService';
import '../Style/Documents.css';
import {
  File,
  FileText,
  ScrollText,
  Table,
  Image,
  Archive,
  Film,
  FolderOpen,
  Upload,
  Check,
  ClipboardList,
  ArrowLeft,
  Trash2
} from 'lucide-react';

function Documents() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [project, setProject] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [showUploadArea, setShowUploadArea] = useState(false);

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' }
  ];

  // Carregar dados do projeto
  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = await projectService.getProjectById(projectId);
        if (projectData) {
          setProject(projectData);
        } else {
          setError('Projeto não encontrado');
        }
      } catch (err) {
        console.error('Erro ao carregar projeto:', err);
        setError('Erro ao carregar projeto');
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // Carregar documentos
  useEffect(() => {
    const loadDocuments = async () => {
      if (!project) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const result = await documentService.listDocuments(project.projectName, currentPath);
        
        if (result.success) {
          setFolders(result.folders);
          setFiles(result.files);
          setBreadcrumb(result.breadcrumb);
        } else {
          setError(result.message);
        }
      } catch (err) {
        console.error('Erro ao carregar documentos:', err);
        setError('Erro ao carregar documentos');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [project, currentPath]);

  // Navegar para uma pasta
  const navigateToFolder = (folderPath) => {
    setCurrentPath(folderPath);
    setSelectedItems([]);
  };

  // Navegar pelo breadcrumb
  const navigateToBreadcrumb = (path) => {
    setCurrentPath(path);
    setSelectedItems([]);
  };

  // Voltar para pasta pai
  const goBack = () => {
    if (currentPath === '') return;
    
    const pathParts = currentPath.split('/').filter(part => part !== '');
    pathParts.pop(); // Remove a última parte
    const parentPath = pathParts.length > 0 ? pathParts.join('/') + '/' : '';
    setCurrentPath(parentPath);
    setSelectedItems([]);
  };

  // Selecionar/deselecionar item
  const toggleItemSelection = (item) => {
    const itemId = item.type === 'folder' ? `folder-${item.path}` : `file-${item.key}`;
    
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Criar nova pasta
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const result = await documentService.createFolder(
        project.projectName,
        currentPath,
        newFolderName.trim()
      );
      
      if (result.success) {
        setShowNewFolderModal(false);
        setNewFolderName('');
        // Recarregar lista
        const updatedResult = await documentService.listDocuments(project.projectName, currentPath);
        if (updatedResult.success) {
          setFolders(updatedResult.folders);
          setFiles(updatedResult.files);
        }
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error('Erro ao criar pasta:', err);
      alert('Erro ao criar pasta');
    }
  };

  // Upload de arquivos
  const handleFileUpload = async (uploadFiles) => {
    if (!uploadFiles || uploadFiles.length === 0) return;
    
    const fileArray = Array.from(uploadFiles);
    
    for (const file of fileArray) {
      const fileId = `upload-${Date.now()}-${Math.random()}`;
      
      try {
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: { name: file.name, progress: 0 }
        }));
        
        const result = await documentService.uploadDocument(
          project.projectName,
          currentPath,
          file,
          (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: { ...prev[fileId], progress }
            }));
          }
        );
        
        if (result.success) {
          // Remover do progresso após sucesso
          setTimeout(() => {
            setUploadProgress(prev => {
              const updated = { ...prev };
              delete updated[fileId];
              return updated;
            });
          }, 2000);
        } else {
          alert(`Erro ao enviar ${file.name}: ${result.message}`);
          setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[fileId];
            return updated;
          });
        }
      } catch (err) {
        console.error('Erro no upload:', err);
        alert(`Erro ao enviar ${file.name}`);
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
      }
    }
    
    // Recarregar lista após todos os uploads
    setTimeout(async () => {
      const updatedResult = await documentService.listDocuments(project.projectName, currentPath);
      if (updatedResult.success) {
        setFolders(updatedResult.folders);
        setFiles(updatedResult.files);
      }
    }, 1000);
  };

  // Deletar itens selecionados
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    
    const confirmDelete = window.confirm(
      `Tem certeza que deseja deletar ${selectedItems.length} item(s)? Esta ação não pode ser desfeita.`
    );
    
    if (!confirmDelete) return;
    
    try {
      for (const itemId of selectedItems) {
        if (itemId.startsWith('folder-')) {
          const folderPath = itemId.replace('folder-', '');
          await documentService.deleteItem(project.projectName, folderPath, 'folder');
        } else if (itemId.startsWith('file-')) {
          const fileKey = itemId.replace('file-', '');
          const fileName = fileKey.split('/').pop();
          await documentService.deleteItem(project.projectName, currentPath + fileName, 'file');
        }
      }
      
      setSelectedItems([]);
      
      // Recarregar lista
      const updatedResult = await documentService.listDocuments(project.projectName, currentPath);
      if (updatedResult.success) {
        setFolders(updatedResult.folders);
        setFiles(updatedResult.files);
      }
      
    } catch (err) {
      console.error('Erro ao deletar itens:', err);
      alert('Erro ao deletar itens');
    }
  };

  // Download de arquivo
  const handleDownload = async (file) => {
    try {
      const downloadUrl = await documentService.getDownloadUrl(file.key);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao baixar arquivo:', err);
      alert('Erro ao baixar arquivo');
    }
  };

  const getFileIconComponent = (extension) => {
    const ext = (extension || '').toLowerCase();
    if (['pdf'].includes(ext)) return <FileText size={20} />;
    if (['doc', 'docx', 'rtf', 'txt'].includes(ext)) return <ScrollText size={20} />;
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <Table size={20} />;
    if (['ppt', 'pptx'].includes(ext)) return <ClipboardList size={20} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) return <Image size={20} />;
    if (['dwg', 'dxf', 'dwf'].includes(ext)) return <Image size={20} />; // fallback; could be CAD-specific icon
    if (['zip', 'rar', '7z'].includes(ext)) return <Archive size={20} />;
    if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return <Film size={20} />;
    return <File size={20} />;
  };

  // Drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setShowUploadArea(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setShowUploadArea(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setShowUploadArea(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileUpload(droppedFiles);
  };

  if (!project) {
    return (
      <Layout menuItems={menuItems}>
        <div className="documents-container">
          <div className="loading-container">
            {error ? <p className="error-message">{error}</p> : <p>Carregando projeto...</p>}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout menuItems={menuItems}>
      <div 
        className="documents-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header */}
        <header className="documents-header">
          <div className="header-left">
            <button 
              className="back-button"
              onClick={() => navigate(`/project/${projectId}`)}
              title="Voltar para detalhes do projeto"
            >
              <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Voltar
            </button>
            <h1>Documentos - {project.projectName}</h1>
          </div>
          
          <div className="header-actions">
            <button 
              className="action-button primary"
              onClick={() => setShowNewFolderModal(true)}
            >
              <FolderOpen size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Nova Pasta
            </button>
            <button 
              className="action-button primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Enviar Arquivos
            </button>
            {selectedItems.length > 0 && (
              <button 
                className="action-button danger"
                onClick={handleDeleteSelected}
              >
                <Trash2 size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Deletar ({selectedItems.length})
              </button>
            )}
          </div>
        </header>

        {/* Breadcrumb */}
        <nav className="breadcrumb">
          {breadcrumb.map((crumb, index) => (
            <React.Fragment key={index}>
              <button
                className="breadcrumb-item"
                onClick={() => navigateToBreadcrumb(crumb.path)}
              >
                {crumb.name}
              </button>
              {index < breadcrumb.length - 1 && <span className="breadcrumb-separator">›</span>}
            </React.Fragment>
          ))}
        </nav>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="upload-progress-container">
            <h3>Enviando arquivos...</h3>
            {Object.entries(uploadProgress).map(([fileId, info]) => (
              <div key={fileId} className="upload-progress-item">
                <span className="upload-filename">{info.name}</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${info.progress}%` }}
                  ></div>
                </div>
                <span className="upload-percentage">{info.progress}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Content Area */}
        <main className="documents-content">
          {loading ? (
            <div className="loading-container">
              <p>Carregando documentos...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button onClick={() => window.location.reload()}>Tentar Novamente</button>
            </div>
          ) : (
            <>
              {/* Navigation Bar */}
              {currentPath !== '' && (
                <div className="navigation-bar">
                  <button className="nav-button" onClick={goBack}>
                    <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Voltar
                  </button>
                </div>
              )}

              {/* Items Grid */}
              <div className="items-grid">
                {/* Folders */}
                {folders.map((folder) => {
                  const itemId = `folder-${folder.path}`;
                  const isSelected = selectedItems.includes(itemId);
                  
                  return (
                    <div
                      key={folder.path}
                      className={`item-card folder-card ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          toggleItemSelection(folder);
                        } else {
                          navigateToFolder(folder.path);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleItemSelection(folder);
                      }}
                    >
                      <div className="item-icon"><FolderOpen size={24} /></div>
                      <div className="item-info">
                        <div className="item-name">{folder.name}</div>
                        <div className="item-details">Pasta</div>
                      </div>
                      {isSelected && <div className="selection-indicator"><Check size={16} /></div>}
                    </div>
                  );
                })}

                {/* Files */}
                {files.map((file) => {
                  const itemId = `file-${file.key}`;
                  const isSelected = selectedItems.includes(itemId);
                  
                  return (
                    <div
                      key={file.key}
                      className={`item-card file-card ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          toggleItemSelection(file);
                        } else {
                          handleDownload(file);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        toggleItemSelection(file);
                      }}
                    >
                      <div className="item-icon">
                        {getFileIconComponent(file.extension)}
                      </div>
                      <div className="item-info">
                        <div className="item-name" title={file.name}>{file.name}</div>
                        <div className="item-details">
                          {documentService.formatFileSize(file.size)} • {file.extension.toUpperCase()}
                        </div>
                        <div className="item-date">
                          {new Date(file.lastModified).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      {isSelected && <div className="selection-indicator"><Check size={16} /></div>}
                    </div>
                  );
                })}

                {/* Empty State */}
                {folders.length === 0 && files.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon"><FolderOpen size={48} /></div>
                    <h3>Pasta vazia</h3>
                    <p>Arraste arquivos aqui ou use o botão "Enviar Arquivos" para adicionar documentos.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {/* Upload Area Overlay */}
        {showUploadArea && (
          <div className="upload-overlay">
            <div className="upload-message">
              <div className="upload-icon"><Upload size={48} /></div>
              <h3>Solte os arquivos aqui</h3>
              <p>Os arquivos serão enviados para: {breadcrumb.map(b => b.name).join(' › ')}</p>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        {/* New Folder Modal */}
        {showNewFolderModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Nova Pasta</h3>
              <input
                type="text"
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <div className="modal-actions">
                <button 
                  className="action-button secondary"
                  onClick={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="action-button primary"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Documents;
