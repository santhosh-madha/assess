import React from 'react';
import './AuthLoadingOverlay.css';

const AuthLoadingOverlay = ({ message }) => {
  return (
    <div className="auth-overlay-backdrop">
      <div className="auth-overlay-content glass-panel">
        <div className="premium-loader"></div>
        <p className="auth-overlay-msg">{message || 'Syncing Session...'}</p>
      </div>
    </div>
  );
};

export default AuthLoadingOverlay;
