import React from 'react';
import './ImagePreview.scss';

const ImagePreview = ({ imageUrl, fileName, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="image-preview">
      <div className="image-preview__backdrop" onClick={onClose}></div>
      <div className="image-preview__dialog" role="dialog" aria-modal="true" aria-label={`Preview ${fileName}`}>
        <div className="image-preview__header">
          <div>
            <span className="image-preview__eyebrow">Preview</span>
            <h3>{fileName}</h3>
          </div>
          <button type="button" className="image-preview__close" onClick={onClose}>Close</button>
        </div>
        <div className="image-preview__body">
          <img src={imageUrl} alt={fileName} />
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;