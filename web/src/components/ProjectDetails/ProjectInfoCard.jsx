import React from 'react';
import { Calendar } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import styles from '../../Style/ProjectDetails.module.css';

const ProjectInfoCard = ({ project, onViewMore }) => {
  return (
    <div className={styles['info-card']}>
      <div className={styles['card-header']}>
        <h3 className={styles['card-title']}>Informações do Projeto</h3>
        <span className={styles['calendar-icon']}><Calendar size={20} /></span>
      </div>
      <div className={styles['steps-list']}>
        <div className={`${styles['step-item']} ${styles.active}`}>
          <div className={styles['step-indicator']}></div>
          <div className={styles['step-content']}>
            <h4 className={styles['step-title']}>Início do Projeto</h4>
            <p className={styles['step-dates']}>{formatDate(project.startDate)}</p>
          </div>
        </div>
        <div className={`${styles['step-item']} ${styles.pending}`}>
          <div className={styles['step-indicator']}></div>
          <div className={styles['step-content']}>
            <h4 className={styles['step-title']}>Prazo Final</h4>
            <p className={styles['step-dates']}>{formatDate(project.endDate)}</p>
          </div>
        </div>
        <div className={`${styles['step-item']} ${styles.active}`}>
          <div className={styles['step-indicator']}></div>
          <div className={styles['step-content']}>
            <h4 className={styles['step-title']}>Última Atualização</h4>
            <p className={styles['step-dates']}>{formatDate(project.updatedAt)}</p>
          </div>
        </div>
      </div>
      <button className={styles['view-more-btn']} onClick={() => onViewMore('etapas')}>
        Ver Mais
      </button>
    </div>
  );
};

export default ProjectInfoCard;
