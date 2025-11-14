import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Bot } from 'lucide-react';
import PageHeader from '../PageHeader/PageHeader';
import styles from '../../Style/ProjectDetails.module.css';
import headerStyles from '../PageHeader/PageHeader.module.css';

const ProjectHeader = ({ projectId, projectName }) => {
  const navigate = useNavigate();

  return (
    <PageHeader
      title={projectName || 'Detalhes do Projeto'}
      subtitle="Visualize e gerencie todos os aspectos do seu projeto."
      headerStyle={styles.projectHeader}
    >
      <button
        className={`${headerStyles.pageHeader_button} ${styles.docsButton}`}
        onClick={() => navigate(`/project/${projectId}/documents`)}
        title="Ver documentos do projeto"
      >
        <FolderOpen size={18} /> Documentos
      </button>
      <button
        className={`${headerStyles.pageHeader_button} ${styles.bimButton}`}
        onClick={() => navigate(`/project/${projectId}/bim-comparison`)}
        title="Comparação BIM com IA - Análise de Progresso e Conformidade"
      >
        <Bot size={18} /> Comparação IA
      </button>
    </PageHeader>
  );
};

export default ProjectHeader;
