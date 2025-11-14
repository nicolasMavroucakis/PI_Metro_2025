import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import projectService from '../services/projectService';
import styles from '../Style/ProjectDetails.module.css';
import {
  Calendar,
} from 'lucide-react';
import {
  formatDate,
} from '../utils/formatters';
import { useProjectDetails } from '../hooks/useProjectDetails';
import ProjectHeader from '../components/ProjectDetails/ProjectHeader';
import ProgressCard from '../components/ProjectDetails/ProgressCard';
import CapturesCard from '../components/ProjectDetails/CapturesCard';
import AlertsCard from '../components/ProjectDetails/AlertsCard';
import ProjectInfoCard from '../components/ProjectDetails/ProjectInfoCard';
import ProgressChart from '../components/ProjectDetails/ProgressChart';
import NewPhotoModal from '../components/ProjectDetails/modals/NewPhotoModal';
import ViewMorePhotosModal from '../components/ProjectDetails/modals/ViewMorePhotosModal';
import UpdateProgressModal from '../components/ProjectDetails/modals/UpdateProgressModal';
import AddAlertModal from '../components/ProjectDetails/modals/AddAlertModal';
import ConfirmationModal from '../components/shared/ConfirmationModal/ConfirmationModal';

function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const {
    project,
    loading,
    error,
    chartData,
    capturePhotos,
    loadingPhotos,
    alerts,
    setAlerts,
    reloadProjectData
  } = useProjectDetails(projectId);
  
  // Estados para UI (modais e formulários)
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [newProgress, setNewProgress] = useState('');
  const [progressObservation, setProgressObservation] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState(false);
  
  const [showNewPhotoModal, setShowNewPhotoModal] = useState(false);
  const [showViewMoreModal, setShowViewMoreModal] = useState(false);
  const [photoCategory, setPhotoCategory] = useState('all');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [allPhotos, setAllPhotos] = useState([]);
  const [loadingAllPhotos, setLoadingAllPhotos] = useState(false);
  
  const [showAddAlertModal, setShowAddAlertModal] = useState(false);
  const [newAlertText, setNewAlertText] = useState('');
  const [newAlertLevel, setNewAlertLevel] = useState('amarelo');
  const [addingAlert, setAddingAlert] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  // Função para atualizar progresso
  const handleUpdateProgress = async () => {
    if (!newProgress || newProgress < 0 || newProgress > 100) {
      alert('Por favor, insira um valor válido entre 0 e 100');
      return;
    }

    try {
      setUpdatingProgress(true);
      
      const result = await projectService.updateProjectProgress(
        projectId,
        parseInt(newProgress),
        progressObservation
      );

      if (result.success) {
        await reloadProjectData();
        
        // Fechar modal e limpar campos
        setShowProgressModal(false);
        setNewProgress('');
        setProgressObservation('');
        
        alert('Progresso atualizado com sucesso!');
      } else {
        alert(`Erro ao atualizar progresso: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      alert('Erro ao atualizar progresso. Tente novamente.');
    } finally {
      setUpdatingProgress(false);
    }
  };

  // Função para abrir modal de progresso
  const handleOpenProgressModal = () => {
    setNewProgress(project?.progress?.toString() || '0');
    setProgressObservation('');
    setShowProgressModal(true);
  };

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' }
  ];

  const handleNewCapture = () => {
    setShowNewPhotoModal(true);
  };

  const handleGenerateReport = () => {
    alert('Funcionalidade de Gerar Relatório será implementada');
  };

  const handleViewMore = (section) => {
    if (section === 'capturas') {
      setShowViewMoreModal(true);
      loadAllPhotos('all');
    } else {
      alert(`Ver mais ${section} será implementado`);
    }
  };

  // Carregar todas as fotos para o modal "Ver Mais"
  const loadAllPhotos = async (category) => {
    try {
      setLoadingAllPhotos(true);
      const photos = await projectService.getProjectPhotosById(projectId, category, 50);
      setAllPhotos(photos);
      setPhotoCategory(category);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoadingAllPhotos(false);
    }
  };

  // Upload de nova foto
  const handlePhotoUpload = async (file, category) => {
    if (!file || !project) return;

    try {
      setUploadingPhoto(true);
      setUploadProgress(0);

      const result = await projectService.uploadPhoto(
        project.projectName,
        file,
        category,
        (progress) => setUploadProgress(progress)
      );

      if (result.success) {
        alert(result.message);
        setShowNewPhotoModal(false);
        await reloadProjectData();
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar foto');
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  // Filtrar fotos por categoria no modal "Ver Mais"
  const handleFilterPhotos = (category) => {
    loadAllPhotos(category);
  };

  // Obter nome da categoria
  const getCategoryName = (category) => {
    switch (category) {
      case 'categoria1':
        return 'Fotos da Obra';
      case 'categoria2':
        return 'Fotos do BIM';
      default:
        return 'Todas';
    }
  };

  // Adicionar novo alerta
  const handleAddAlert = async () => {
    if (!newAlertText.trim()) {
      alert('Por favor, digite o texto do alerta');
      return;
    }

    try {
      setAddingAlert(true);
      
      const newAlert = {
        id: Date.now().toString(),
        text: newAlertText,
        level: newAlertLevel,
        createdAt: new Date().toISOString(),
        createdBy: localStorage.getItem('userName') || 'Usuário'
      };

      const updatedAlerts = [...alerts, newAlert];
      
      // Salvar no DynamoDB
      const result = await projectService.updateProject(projectId, {
        alerts: updatedAlerts
      });

      if (result.success) {
        setAlerts(updatedAlerts);
        setNewAlertText('');
        setNewAlertLevel('amarelo');
        setShowAddAlertModal(false);
        alert('Alerta adicionado com sucesso!');
      } else {
        alert(`Erro ao adicionar alerta: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar alerta:', error);
      alert('Erro ao adicionar alerta');
    } finally {
      setAddingAlert(false);
    }
  };

  // Apagar foto
  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;

    try {
      // Chamar serviço para apagar a foto no S3
      const result = await projectService.deletePhoto(photoToDelete.key);

      if (result.success) {
        // Remover a foto da lista atual `allPhotos`
        setAllPhotos(prevPhotos => prevPhotos.filter(p => p.key !== photoToDelete.key));
        
        // Opcional: Recarregar dados do projeto para atualizar a visão geral
        await reloadProjectData();

        alert('Foto apagada com sucesso!');
      } else {
        alert(`Erro ao apagar foto: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao apagar foto:', error);
      alert('Erro ao apagar foto. Tente novamente.');
    } finally {
      setShowConfirmModal(false);
      setPhotoToDelete(null);
    }
  };
  
  // Abrir modal de confirmação para apagar foto
  const requestDeletePhoto = (photo) => {
    setPhotoToDelete(photo);
    setShowConfirmModal(true);
  };

  // (removido) handleDeleteAlert não é mais utilizado

  // Se estiver carregando
  if (loading) {
    return (
      <Layout menuItems={menuItems}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Carregando dados do projeto...</p>
        </div>
      </Layout>
    );
  }

  // Se houver erro
  if (error) {
    return (
      <Layout menuItems={menuItems}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#f44336' }}>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/home')}
            style={{ 
              marginTop: '1rem', 
              padding: '0.5rem 1rem', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Voltar para Home
          </button>
        </div>
      </Layout>
    );
  }

  // Se não encontrou o projeto
  if (!project) {
    return (
      <Layout menuItems={menuItems}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Projeto não encontrado</p>
          <button 
            onClick={() => navigate('/home')}
            style={{ 
              marginTop: '1rem', 
              padding: '0.5rem 1rem', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Voltar para Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout menuItems={menuItems}>
      <ProjectHeader projectId={projectId} projectName={project?.projectName} />
      
      <main className={styles['project-details-main']}>
        <div className={styles['project-content-grid']}>
          {/* Progresso da Obra */}
          <ProgressCard project={project} onUpdateProgress={handleOpenProgressModal} />

          {/* Últimas Capturas */}
          <CapturesCard 
            loadingPhotos={loadingPhotos}
            capturePhotos={capturePhotos}
            onViewMore={handleViewMore}
            onNewCapture={handleNewCapture}
          />

          {/* Alertas */}
          <AlertsCard alerts={alerts} onAddAlert={() => setShowAddAlertModal(true)} />

          {/* Próximas Etapas */}
          <ProjectInfoCard project={project} onViewMore={handleViewMore} />
        </div>

        {/* Gráfico de Progresso */}
        <ProgressChart chartData={chartData} onGenerateReport={handleGenerateReport} />
      </main>

      {/* Modal de Nova Foto */}
      <NewPhotoModal 
        show={showNewPhotoModal}
        onClose={() => setShowNewPhotoModal(false)}
        onPhotoUpload={handlePhotoUpload}
        uploadingPhoto={uploadingPhoto}
        uploadProgress={uploadProgress}
      />

      {/* Modal de Ver Mais Fotos */}
      <ViewMorePhotosModal
        show={showViewMoreModal}
        onClose={() => setShowViewMoreModal(false)}
        photoCategory={photoCategory}
        onFilterPhotos={handleFilterPhotos}
        loadingAllPhotos={loadingAllPhotos}
        allPhotos={allPhotos}
        getCategoryName={getCategoryName}
        onDeletePhoto={requestDeletePhoto}
      />

      {/* Modal de Atualização de Progresso */}
      <UpdateProgressModal
        show={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        onUpdate={handleUpdateProgress}
        updating={updatingProgress}
        newProgress={newProgress}
        setNewProgress={setNewProgress}
        progressObservation={progressObservation}
        setProgressObservation={setProgressObservation}
      />

      {/* Modal de Adicionar Alerta */}
      <AddAlertModal
        show={showAddAlertModal}
        onClose={() => setShowAddAlertModal(false)}
        onAdd={handleAddAlert}
        adding={addingAlert}
        newAlertText={newAlertText}
        setNewAlertText={setNewAlertText}
        newAlertLevel={newAlertLevel}
        setNewAlertLevel={setNewAlertLevel}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleDeletePhoto}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja apagar a foto "${photoToDelete?.fileName}"? Esta ação não pode ser desfeita.`}
      />
    </Layout>
  );
}

export default ProjectDetails;

