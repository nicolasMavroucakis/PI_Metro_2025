import React from 'react';
import { getProgressColor } from '../../utils/formatters';
import styles from '../../Style/ProjectDetails.module.css';

const ProgressCard = ({ project, onUpdateProgress }) => {
  return (
    <div className={styles['progress-card']}>
      <h3 className={styles['card-title']}>Progresso da Obra</h3>
      <div className={styles['progress-circle-container']}>
        <div className={styles['progress-circle']}>
          <svg viewBox="0 0 120 120" className={styles['progress-svg']}>
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={getProgressColor(project.status)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(project.progress || 0) * 3.14} 314`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className={styles['progress-text']}>
            <span className={styles['progress-percentage']}>{project.progress || 0}%</span>
          </div>
        </div>
      </div>
      <button 
        className={styles['view-more-btn']} 
        onClick={onUpdateProgress}
      >
        Atualizar Progresso
      </button>
    </div>
  );
};

export default ProgressCard;
