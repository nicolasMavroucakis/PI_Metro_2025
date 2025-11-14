import React from 'react';
import styles from './PageHeader.module.css';

const PageHeader = ({ title, subtitle, children, headerStyle, titleStyle, subtitleStyle }) => {
  return (
    <header className={`${styles.pageHeader} ${headerStyle}`}>
      <div className={styles.pageHeader_content}>
        <h1 className={`${styles.pageHeader_title} ${titleStyle}`}>{title}</h1>
        <p className={`${styles.pageHeader_subtitle} ${subtitleStyle}`}>{subtitle}</p>
      </div>
      <div className={styles.pageHeader_actions}>
        {children}
      </div>
    </header>
  );
};

export default PageHeader;
