import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import Navigation from './Navigation';
import authService from '../auth/authService';
import './FileUploadPage.css';

const FileUploadPage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
  }, []);

  const handleUploadComplete = (result) => {
    console.log('Upload completed:', result);
    // You could add additional logic here, like showing a notification
    // or refreshing some data
  };

  return (
    <div className="app-layout">
      <Navigation user={user} />
      <main className="main-content">
        <div className="file-upload-page">
          <div className="page-header">
            <h1>📚 Knowledge Base Management</h1>
            <p>Upload PDF documents to enhance the AI PECARN assistant's knowledge and capabilities</p>
          </div>
          
          <div className="upload-section">
            <FileUpload onUploadComplete={handleUploadComplete} />
          </div>

          <div className="info-section">
            <div className="info-card">
              <h3>🎯 About PECARN Documents</h3>
              <p>
                The Pediatric Emergency Care Applied Research Network (PECARN) system processes 
                clinical records, research data, and patient encounter summaries. Upload relevant 
                documents in various formats to help the AI PECARN assistant provide more accurate and comprehensive responses.
              </p>
            </div>

            <div className="info-card">
              <h3>📋 Document Guidelines</h3>
              <ul>
                <li>Supported formats: PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), Excel (XLS/XLSX), Text (TXT), Markdown (MD), CSV, HTML</li>
                <li>Maximum file size: 10MB per document</li>
                <li>Medical records and clinical data preferred</li>
                <li>Research papers and case studies welcome</li>
                <li>Patient data should be de-identified</li>
                <li>Multiple file formats can be mixed in the knowledge base</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>📁 Supported File Types</h3>
              <div className="supported-formats">
                <div className="formats-grid">
                  <div className="format-item">
                    <span className="format-icon pdf">📄</span>
                    <span className="format-name">PDF Documents</span>
                    <span className="format-ext">.pdf</span>
                  </div>
                  <div className="format-item">
                    <span className="format-icon doc">📝</span>
                    <span className="format-name">Word Documents</span>
                    <span className="format-ext">.doc, .docx</span>
                  </div>
                  <div className="format-item">
                    <span className="format-icon ppt">📊</span>
                    <span className="format-name">PowerPoint</span>
                    <span className="format-ext">.ppt, .pptx</span>
                  </div>
                  <div className="format-item">
                    <span className="format-icon xls">📈</span>
                    <span className="format-name">Excel Sheets</span>
                    <span className="format-ext">.xls, .xlsx</span>
                  </div>
                  <div className="format-item">
                    <span className="format-icon txt">📃</span>
                    <span className="format-name">Text Files</span>
                    <span className="format-ext">.txt</span>
                  </div>
                  <div className="format-item">
                    <span className="format-icon md">📋</span>
                    <span className="format-name">Markdown</span>
                    <span className="format-ext">.md</span>
                  </div>
                  <div className="format-item">
                    <span className="format-icon csv">📊</span>
                    <span className="format-name">CSV Data</span>
                    <span className="format-ext">.csv</span>
                  </div>
                  <div className="format-item">
                    <span className="format-icon html">🌐</span>
                    <span className="format-name">HTML Files</span>
                    <span className="format-ext">.html, .htm</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>⚡ Processing Information</h3>
              <ul>
                <li>Files are securely stored in AWS S3</li>
                <li>Knowledge base sync happens automatically</li>
                <li>Processing typically takes 2-5 minutes</li>
                <li>New content becomes available after sync completion</li>
                <li>The AI will reference uploaded documents in responses</li>
                <li>All file formats are processed and indexed equally</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FileUploadPage;
