import { useState, useEffect } from 'react';
import projectService from '../services/projectService';

export const useProjectDetails = (projectId) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], data: [], isEmpty: true });
  const [capturePhotos, setCapturePhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        setError('ID do projeto não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const projectData = await projectService.getProjectById(projectId);
        if (!projectData) {
          setError('Projeto não encontrado');
          setLoading(false);
          return;
        }

        setProject(projectData);
        setAlerts(projectData.alerts || []);

        const chartInfo = await projectService.getProgressChartData(projectId);
        setChartData(chartInfo);

        setLoadingPhotos(true);
        try {
          const photos = await projectService.getProjectCapturePhotosById(projectId, 6);
          setCapturePhotos(photos);
        } catch (photoError) {
          console.error('Erro ao carregar fotos:', photoError);
        } finally {
          setLoadingPhotos(false);
        }

      } catch (err) {
        console.error('Erro ao carregar dados do projeto:', err);
        setError('Erro ao carregar dados do projeto. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId]);

  const reloadProjectData = async () => {
    try {
        // Apenas um exemplo simples de recarga, pode ser melhorado
        const projectData = await projectService.getProjectById(projectId);
        setProject(projectData);

        const chartInfo = await projectService.getProgressChartData(projectId);
        setChartData(chartInfo);

        const photos = await projectService.getProjectCapturePhotosById(projectId, 6);
        setCapturePhotos(photos);

        setAlerts(projectData.alerts || []);
    } catch (error) {
        console.error("Falha ao recarregar dados do projeto", error);
        // Opcional: setar um erro específico de recarga
    }
  };


  return { 
    project, 
    loading, 
    error, 
    chartData, 
    capturePhotos, 
    loadingPhotos, 
    alerts,
    setProject,
    setChartData,
    setCapturePhotos,
    setAlerts,
    reloadProjectData
  };
};
