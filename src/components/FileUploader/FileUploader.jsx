import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUploader.scss';

const FileUploader = ({ onFilesSelected }) => {
  const onDrop = useCallback((acceptedFiles) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  // Set accept to only allow image files
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': [] // Accept all image types
    }
  });

  const inputProps = getInputProps(); // Store input props to avoid multiple calls

  const handleButtonClick = (event) => {
    event.stopPropagation(); // Prevent event bubbling
    document.getElementById('file-input').click(); // Trigger file input click
  };

  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
      <input id='file-input' type='file' {...inputProps} accept="image/*" style={{ display: 'none' }} />
      <div className="upload-content">
        <div className="upload-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M12 16V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M7.5 9.5L12 5l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 18.5C5 17.1193 6.11929 16 7.5 16H16.5C17.8807 16 19 17.1193 19 18.5C19 19.8807 17.8807 21 16.5 21H7.5C6.11929 21 5 19.8807 5 18.5Z" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </div>
        <h3>{isDragActive ? 'Drop images to process locally' : 'Upload images privately'}</h3>
        <p>Compression happens only in this browser session.</p>
        <button type="button" className="upload-button" onClick={handleButtonClick}>Choose images</button>
        <span className="upload-caption">or drag JPG, PNG, WEBP, and more</span>
      </div>
    </div>
  );
};

export default FileUploader;
