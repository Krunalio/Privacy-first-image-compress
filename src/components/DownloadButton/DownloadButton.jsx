import React from 'react';
import './DownloadButton.scss';

const DownloadButton = ({ files, disabled }) => {
  const handleDownload = () => {
    files.forEach(file => {
      const blobUrl = URL.createObjectURL(file.file);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    });
  };

  return (
    <button className="download-button" onClick={handleDownload} disabled={disabled}>
      Download Compressed Files
    </button>
  );
};

export default DownloadButton;
