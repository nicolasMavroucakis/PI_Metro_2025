import React from 'react';
import { Calendar, Edit2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import styles from '../../Style/ProjectDetails.module.css';

const ProjectInfoCard = ({ project, onViewMore, onEditDeadline }) => {
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
            <div className={styles['deadline-wrapper']}>
              <p className={styles['step-dates']}>{formatDate(project.endDate)}</p>
              {onEditDeadline && (
                <button
                  className={styles['edit-deadline-btn']}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditDeadline();
                  }}
                  title="Editar prazo final"
                >
                  <Edit2 size={14} />
                </button>
              )}
            </div>
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
