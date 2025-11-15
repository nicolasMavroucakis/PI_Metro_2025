import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BottomNavBar.css';
import MetroLogo from '../assets/metro.png';

const BottomNavBar = ({ menuItems = [] }) => {
  const navigate = useNavigate();

  const handleMenuItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
    }
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <footer className="bottom-nav-bar">
      <div className="bottom-nav-logo">
        <img src={MetroLogo} alt="Metrô SP" />
      </div>
      <nav className="bottom-nav-items">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleMenuItemClick(item)}
            className={`nav-item ${item.active ? 'active' : ''}`}
            aria-label={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </footer>
  );
};

export default BottomNavBar;
