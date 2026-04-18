import React from 'react';
import './ProgressIndicator.scss'; // We'll create this file for styling

const ProgressIndicator = ({ progress }) => {
  // Ensure progress is a number between 0 and 100
  const safeProgress = Math.min(Math.max(0, progress), 100);
  const statusLabel = safeProgress === 0 ? 'Ready to compress' : safeProgress === 100 ? 'Compression complete' : 'Compressing locally';

  return (
    <div className="progress-container">
      <div className="progress-meta">
        <strong>{statusLabel}</strong>
        <span>{Math.round(safeProgress)}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${safeProgress}%` }}></div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
