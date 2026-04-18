import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import CompressionSettings from './components/CompressionSettings';
import ProgressIndicator from './components/ProgressIndicator/ProgressIndicator';
import ImagePreview from './components/ImagePreview'; 
import JSZip from 'jszip'; 
import FileSaver from 'file-saver'; // Import FileSaver for downloading files
import './App.scss';

const formatFileSize = (size) => {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(size / 1024).toFixed(0)} KB`;
};

function App() {
  const [files, setFiles] = useState([]);
  const [compressedFiles, setCompressedFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [compressionSettings, setCompressionSettings] = useState({
    level: 'medium',
    preserveQuality: false,
    imageFormats: ['jpeg', 'png', 'webp'],
  });
  const [compressionDetails, setCompressionDetails] = useState([]);
  const [previewCompressedFile, setPreviewCompressedFile] = useState(null);
  const [keepOriginalName, setKeepOriginalName] = useState(false);

  const handleFileUpload = (uploadedFiles) => {
    setFiles(prevFiles => [...prevFiles, ...uploadedFiles]);
    setCompressedFiles([]);
    setPreviewCompressedFile(null);
  };

  const handleSettingsChange = (newSettings) => {
    setCompressionSettings(newSettings);
  };

  const compressImage = (file, level) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, img.width, img.height);
          
          // Adjust quality based on compression level
          const baseQuality = level === 'low' ? 0.78 : level === 'medium' ? 0.58 : 0.4;
          const quality = compressionSettings.preserveQuality ? Math.min(baseQuality + 0.12, 0.92) : baseQuality;
          
          canvas.toBlob((blob) => {
            const newFileName = keepOriginalName ? file.name : `compressed_${file.name}`;
            resolve(new File([blob], newFileName, { type: 'image/jpeg' }));
          }, 'image/jpeg', quality);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCompression = async () => {
    setProgress(0);
    const totalFiles = files.length;
    const compressed = [];
    const details = []; // Array to hold compression details

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      let compressedFile;

      if (file.type.startsWith('image/')) {
        compressedFile = await compressImage(file, compressionSettings.level);
      } else {
        compressedFile = new File([file], file.name, { type: file.type });
      }

      details.push({
        name: file.name,
        originalSize: file.size,
        compressedSize: compressedFile.size,
      });

      compressed.push({
        file: compressedFile,
        name: file.name,
        originalSize: file.size,
        compressedSize: compressedFile.size,
      });

      setProgress(((i + 1) / totalFiles) * 100);
    }

    setCompressedFiles(compressed);
    setCompressionDetails(details); // Update compression details
  };

  const handleSingleImageDownload = () => {
    if (compressedFiles.length === 1) {
      const file = compressedFiles[0].file;
      FileSaver.saveAs(file, file.name); // Use FileSaver to download the file
    }
  };

  const handleZipDownload = () => {
    const zip = new JSZip();
    compressedFiles.forEach((compressedFile) => {
      zip.file(compressedFile.name, compressedFile.file);
    });
    zip.generateAsync({ type: 'blob' }).then((content) => {
      FileSaver.saveAs(content, 'compressed_images.zip'); // Download the zip file
    });
  };

  const handleBackButtonClick = () => {
    setFiles([]); // Reset files
    setCompressedFiles([]); // Reset compressed files
    setPreviewCompressedFile(null); // Reset preview
    setProgress(0); // Reset progress
    setCompressionDetails([]); // Reset compression details
  };

  const handleRemoveImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);

    // If the last image is removed, reset all states
    if (newFiles.length === 0) {
      setCompressedFiles([]); // Reset compressed files
      setPreviewCompressedFile(null); // Reset preview
      setProgress(0); // Reset progress
      setCompressionDetails([]); // Reset compression details
    }
  };

  const totalOriginalSize = compressionDetails.reduce((sum, detail) => sum + detail.originalSize, 0);
  const totalCompressedSize = compressionDetails.reduce((sum, detail) => sum + detail.compressedSize, 0);
  const savedBytes = Math.max(totalOriginalSize - totalCompressedSize, 0);
  const savedPercent = totalOriginalSize > 0 ? Math.round((savedBytes / totalOriginalSize) * 100) : 0;
  const hasResults = compressionDetails.length > 0;

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--left"></div>
      <div className="app-shell__glow app-shell__glow--right"></div>

      <div className="App">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">Privacy First Compress</span>
            <h1>Upload, compress, and download instantly.</h1>
            <p>
              Your images never leave your device. No server upload. No cloud storage. Everything runs locally in your browser.
            </p>
          </div>
        </header>

        <main className="workspace-grid">
          <section className="workspace-card workspace-card--primary workspace-panel">
            <div className="section-heading">
              <div>
                <span className="section-heading__eyebrow">Step 1: Upload</span>
                <h2>Select your images</h2>
              </div>
              <p>Drag & drop or click to browse. Your images stay private on your device.</p>
            </div>

            <FileUploader onFilesSelected={handleFileUpload} />

            <div className="panel-note">
              <strong>Privacy First</strong>
              <span>All processing happens in your browser. Images never leave your device.</span>
            </div>

            {files.length > 0 ? (
              <>
                <div className="selection-bar">
                  <div>
                    <strong>{files.length}</strong> image{files.length > 1 ? 's' : ''} ready
                  </div>
                  <div>Total input size: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}</div>
                </div>

                <div className="uploaded-images uploaded-images--scrollable">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="uploaded-image">
                      <img src={URL.createObjectURL(file)} alt={file.name} />
                      <button
                        type="button"
                        className="uploaded-image-btn"
                        onClick={() => handleRemoveImage(index)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
                          <polygon fill="currentColor" fillRule="evenodd" points="12 1.208 10.79 0 6 4.792 1.21 0 0 1.208 4.79 6 0 10.792 1.21 12 6 7.208 10.79 12 12 10.792 7.21 6"></polygon>
                        </svg>
                      </button>
                      <div className="uploaded-image__meta">
                        <strong title={file.name}>{file.name}</strong>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state-card">
                <strong>Ready for private compression.</strong>
                <span>Add one or more images to start the local workflow.</span>
              </div>
            )}
          </section>

          <section className="workspace-card workspace-card--secondary workspace-panel">
            <div className="section-heading">
              <div>
                <span className="section-heading__eyebrow">Step 2 & 3: Compress & Download</span>
                <h2>Configure and export</h2>
              </div>
              <p>Adjust settings, compress locally, and download instantly with zero privacy compromise.</p>
            </div>

            <div className="panel-stack">
              <div className="compression-settings">
              <CompressionSettings
                settings={compressionSettings}
                onSettingsChange={handleSettingsChange}
              />

              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={keepOriginalName}
                  onChange={(event) => setKeepOriginalName(event.target.checked)}
                />
                <span>Keep original filename</span>
              </label>
              </div>

              <div className="action-header">
                <strong>Compress and export</strong>
                <span>{files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'No files selected yet'}</span>
              </div>

              <ProgressIndicator progress={progress} />

              <div className="button-container">
                <button
                  className="compress-button"
                  onClick={handleCompression}
                  disabled={files.length === 0}
                >
                  Start local compression
                </button>

                <button
                  className="back-button"
                  onClick={handleBackButtonClick}
                  disabled={files.length === 0 && compressedFiles.length === 0}
                >
                  Reset workspace
                </button>

                {compressedFiles.length === 1 && (
                  <button
                    className="download-button download-button--secondary"
                    onClick={() => setPreviewCompressedFile(compressedFiles[0].file)}
                  >
                    Preview result
                  </button>
                )}

                {compressedFiles.length === 1 && (
                  <button
                    className="download-button"
                    onClick={handleSingleImageDownload}
                  >
                    Download image
                  </button>
                )}

                <button
                  className="download-button download-button--secondary"
                  onClick={handleZipDownload}
                  disabled={compressedFiles.length === 0}
                >
                  Download {compressedFiles.length === 1 ? 'zip package' : 'zip archive'}
                </button>
              </div>

              <div className="privacy-note privacy-note--compact">
                <strong>Privacy promise</strong>
                <p>
                  Compression runs locally in browser memory. No image is transmitted or stored remotely.
                </p>
              </div>

              {hasResults && (
                <div className="results-panel results-panel--scrollable">
                  <div className="results-summary-grid">
                    <div className="results-summary-card">
                      <span>Total original</span>
                      <strong>{formatFileSize(totalOriginalSize)}</strong>
                    </div>
                    <div className="results-summary-card">
                      <span>Total compressed</span>
                      <strong>{formatFileSize(totalCompressedSize)}</strong>
                    </div>
                    <div className="results-summary-card">
                      <span>Saved</span>
                      <strong>{savedPercent}%</strong>
                    </div>
                  </div>

                  <div className="compression-details">
                    <h3>Compression report</h3>
                    <ul>
                      {compressionDetails.map((detail, index) => (
                        <li key={`${detail.name}-${index}`}>
                          <div>
                            <strong>{detail.name}</strong>
                            <span>{formatFileSize(detail.originalSize)} to {formatFileSize(detail.compressedSize)}</span>
                          </div>
                          <span>
                            {detail.originalSize > 0
                              ? `${Math.max(
                                  0,
                                  Math.round(((detail.originalSize - detail.compressedSize) / detail.originalSize) * 100)
                                )}% smaller`
                              : '0% smaller'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <p className="panel-credit">
                Built by <a href="https://www.instagram.com/krunal.avatar">Krunal</a>
              </p>
            </div>
          </section>
        </main>

        {previewCompressedFile && (
          <ImagePreview
            imageUrl={URL.createObjectURL(previewCompressedFile)}
            fileName={previewCompressedFile.name}
            onClose={() => setPreviewCompressedFile(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
