import React from 'react';
import styles from '../../Style/ProjectDetails.module.css';

const ProgressChart = ({ chartData }) => {
  return (
    <div className={styles['chart-section']}>
      <div className={styles['chart-header']}>
        <h3 className={styles['card-title']}>Evolução do Progresso</h3>
        <div className={styles['chart-legend']}>
          <div className={styles['legend-item']}>
            <span className={`${styles['legend-dot']} ${styles.executed}`}></span>
            <span>Progresso Real</span>
          </div>
        </div>
      </div>
      <div className={styles['chart-container']}>
        {chartData.isEmpty ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <p>Nenhum histórico de progresso disponível ainda.</p>
            <p>Atualize o progresso do projeto para começar a ver a evolução.</p>
          </div>
        ) : (
          <>
            <div className={styles['chart-y-axis']}>
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            <div className={styles['chart-area']}>
              <svg viewBox="0 0 600 200" className={styles['progress-chart']}>
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="60" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="600" height="200" fill="url(#grid)" />
                
                {/* Progress line */}
                {chartData.data.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#1976D2"
                    strokeWidth="3"
                    points={chartData.data.map((value, index) => {
                      const x = (index / (chartData.data.length - 1)) * 580 + 10;
                      const y = 200 - (value / 100) * 180 - 10;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                )}
                
                {/* Data points */}
                {chartData.data.map((value, index) => {
                  const x = (index / Math.max(chartData.data.length - 1, 1)) * 580 + 10;
                  const y = 200 - (value / 100) * 180 - 10;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#1976D2"
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>
            </div>
            <div className={styles['chart-x-axis']}>
              {chartData.labels.map((label, index) => (
                <span key={index} style={{ fontSize: '12px' }}>{label}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressChart;
