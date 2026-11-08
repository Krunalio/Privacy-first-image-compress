import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import CompressionSettings from './components/CompressionSettings';
import ProgressIndicator from './components/ProgressIndicator/ProgressIndicator';
import ImagePreview from './components/ImagePreview'; 
import JSZip from 'jszip'; 
import FileSaver from 'file-saver'; // Import FileSaver for downloading files
import { compressImage } from './utils/compress';
import './App.scss';

const GITHUB_URL = 'https://github.com/Krunalio/Privacy-first-image-compress';

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
  const [keepMetadata, setKeepMetadata] = useState(true);

  const handleFileUpload = (uploadedFiles) => {
    setFiles(prevFiles => [...prevFiles, ...uploadedFiles]);
    setCompressedFiles([]);
    setPreviewCompressedFile(null);
  };

  const handleSettingsChange = (newSettings) => {
    setCompressionSettings(newSettings);
  };

  const handleCompression = async () => {
    setProgress(0);
    const totalFiles = files.length;
    const compressed = [];
    const details = [];
    const options = { ...compressionSettings, keepMetadata, keepOriginalName };

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const result = await compressImage(file, options);

      details.push({
        name: file.name,
        originalSize: file.size,
        compressedSize: result.file.size,
        keptOriginal: result.keptOriginal,
        reason: result.reason,
      });

      compressed.push({
        file: result.file,
        name: result.file.name,
        originalSize: file.size,
        compressedSize: result.file.size,
      });

      setProgress(((i + 1) / totalFiles) * 100);
    }

    setCompressedFiles(compressed);
    setCompressionDetails(details);
  };

  const handleSingleImageDownload = () => {
    if (compressedFiles.length === 1) {
      const file = compressedFiles[0].file;
      FileSaver.saveAs(file, file.name); // Use FileSaver to download the file
    }
  };

  const handleZipDownload = () => {
    const zip = new JSZip();
    const usedNames = new Set();
    compressedFiles.forEach(({ file }) => {
      // Avoid two files overwriting each other inside the archive.
      let name = file.name;
      const dot = name.lastIndexOf('.');
      const stem = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : '';
      for (let n = 1; usedNames.has(name.toLowerCase()); n++) {
        name = `${stem} (${n})${ext}`;
      }
      usedNames.add(name.toLowerCase());
      zip.file(name, file, { date: new Date(file.lastModified) });
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
            <span className="eyebrow">Your Privacy First</span>
            <h1>Privately Upload, compress, and download instantly.</h1>
            <p>
              Your images never leave your device. No server upload. No cloud storage. Everything runs locally in your browser.
            </p>
          </div>
          {/* Plain link on purpose: a live star count would need a network request, which the privacy CSP blocks. */}
          <a
            className="github-star"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span>Star on GitHub</span>
            <svg aria-hidden="true" className="github-star__icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.53L12 17.5l-5.87 3.07 1.12-6.53L2.5 9.41l6.56-.95L12 2.5z" />
            </svg>
          </a>
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
                <span className="section-heading__eyebrow">Compression settings</span>
                <h2>Choose output settings</h2>
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

              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={keepMetadata}
                  onChange={(event) => setKeepMetadata(event.target.checked)}
                />
                <span>Keep photo details (date taken, camera, location) in JPEGs</span>
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
                            {detail.keptOriginal
                              ? `${detail.reason}, original kept`
                              : detail.originalSize > 0
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
                Built by Krunal · Open source on{' '}
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
                {' '}· Contact: <a href="mailto:joshiikrunall@gmail.com">joshiikrunall@gmail.com</a>
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
