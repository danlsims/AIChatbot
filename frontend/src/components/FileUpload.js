import React, { useState } from 'react';
import authService from '../auth/authService';
import config from '../config';
import './FileUpload.css';

const FileUpload = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;

    // Supported file extensions for Bedrock Knowledge Base
    const supportedExtensions = [
      '.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', 
      '.txt', '.md', '.csv', '.html', '.htm'
    ];

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isSupported = supportedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isSupported) {
      setUploadStatus('Error: Supported file types are PDF, Word, PowerPoint, Excel, Text, Markdown, CSV, and HTML files');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus('Error: File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus('Uploading file...');

    try {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Get the ID token from localStorage (same way other parts of the app do it)
      const idToken = localStorage.getItem('idToken');
      if (!idToken) {
        throw new Error('No authentication token found');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Upload file
      const response = await fetch(config.fileUpload.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus(`✅ Success! File "${result.fileName}" uploaded successfully. Knowledge base will be updated automatically.`);
        setSelectedFile(null);
        if (onUploadComplete) {
          onUploadComplete(result);
        }
      } else {
        setUploadStatus(`❌ Error: ${result.error || 'Upload failed'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`❌ Error: ${error.message || 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus('');
  };

  return (
    <div className="file-upload-container">
      <div className="file-upload-header">
        <h3>📚 Upload Knowledge Base Document</h3>
        <p>Upload documents to enhance the AI PECARN assistant's knowledge</p>
      </div>

      <div 
        className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <>
            <div className="drop-zone-content">
              <div className="upload-icon">📄</div>
              <p>Drag and drop a document here, or</p>
              <label className="file-input-label">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt,.md,.csv,.html,.htm"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                Choose File
              </label>
            </div>
            <div className="file-requirements">
              <small>
                • Supported: PDF, Word, PowerPoint, Excel, Text, Markdown, CSV, HTML<br/>
                • Maximum file size: 10MB<br/>
                • PECARN medical documents preferred
              </small>
            </div>
          </>
        ) : (
          <div className="selected-file">
            <div className="file-info">
              <div className="file-icon">📄</div>
              <div className="file-details">
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            </div>
            <div className="file-actions">
              <button 
                onClick={uploadFile} 
                disabled={uploading}
                className="upload-btn"
              >
                {uploading ? '⏳ Uploading...' : '📤 Upload & Sync'}
              </button>
              <button 
                onClick={clearFile} 
                disabled={uploading}
                className="clear-btn"
              >
                ❌ Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {uploadStatus && (
        <div className={`upload-status ${uploadStatus.includes('Error') || uploadStatus.includes('❌') ? 'error' : 'success'}`}>
          {uploadStatus}
        </div>
      )}

      <div className="upload-info">
        <h4>ℹ️ About Knowledge Base Sync</h4>
        <ul>
          <li>Files are uploaded to the secure S3 knowledge base</li>
          <li>Knowledge base sync starts automatically after upload</li>
          <li>It may take a few minutes for new content to be available</li>
          <li>The AI PECARN assistant will use this content to answer questions</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;
