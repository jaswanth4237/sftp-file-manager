"use client";

import React, { useState, useEffect, Suspense, useTransition } from "react";
import Skeleton from "./Skeleton";

interface FileItem {
  name: string;
  type: 'd' | ' - ' | 'l' | '-';
  size: number;
  modifyTime: number;
  rights: {
    user: string;
    group: string;
    other: string;
  };
}

export default function SFTPManager() {
  const [currentPath, setCurrentPath] = useState("/upload");
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewFile, setPreviewFile] = useState<{ path: string; name: string; type: string } | null>(null);
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const fetchFiles = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sftp/list?path=${encodeURIComponent(path)}&t=${Date.now()}`);
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setFileList(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  const handleNavigate = (name: string) => {
    const newPath = `${currentPath}/${name}`.replace(/\/+/g, '/');
    setCurrentPath(newPath);
  };

  const handleBack = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath("/" + parts.join("/"));
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("path", currentPath); // Path first for Busboy handler
    formData.append("file", file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress((event.loaded / event.total) * 100);
      }
    };

    xhr.onload = () => {
      setUploadProgress(null);
      if (xhr.status === 201) {
        fetchFiles(currentPath);
      } else {
        alert("Upload failed: " + xhr.responseText);
      }
    };

    xhr.open("POST", "/api/sftp/upload");
    xhr.send(formData);
  };

  const handleDelete = async (name: string) => {
     if (!confirm(`Delete ${name}?`)) return;
     const pathToDelete = `${currentPath}/${name}`.replace(/\/+/g, '/');
     try {
         const res = await fetch(`/api/sftp/delete?path=${encodeURIComponent(pathToDelete)}`, { method: "DELETE" });
         if (!res.ok) throw new Error(await res.text());
         fetchFiles(currentPath);
     } catch (err: any) {
         alert("Delete failed: " + err.message);
     }
  };

  const handeDownload = (name: string) => {
     const path = `${currentPath}/${name}`.replace(/\/+/g, '/');
     window.open(`/api/sftp/download?path=${encodeURIComponent(path)}`, "_blank");
  };

  const handlePreview = async (file: FileItem) => {
    const path = `${currentPath}/${file.name}`.replace(/\/+/g, '/');
    const ext = file.name.split('.').pop()?.toLowerCase();
    setPreviewFile({ path, name: file.name, type: ext || '' });
    
    // For text files, fetch content
    if (['txt', 'json', 'md', 'js', 'ts', 'html', 'css', 'mjs', 'cjs'].includes(ext || '')) {
       try {
           console.log("Fetching preview for:", path);
           const res = await fetch(`/api/sftp/download?path=${encodeURIComponent(path)}`);
           if (!res.ok) {
              const errText = await res.text();
              console.error("Preview fetch failed:", errText);
              throw new Error(errText);
           }
           const text = await res.text();
           setPreviewContent(text);
       } catch (err: any) {
           console.error("Preview error catch:", err);
           setPreviewContent(`Error loading preview: ${err.message}`);
       }
    } else {
       setPreviewContent(null);
    }
  };

  return (
    <div className="file-manager">
      <div className="sidebar" data-test-id="directory-tree">
        <h3 style={{ padding: '0 20px' }}>Projects</h3>
        <ul style={{ listStyle: 'none', padding: '0 20px' }}>
          <li onClick={() => setCurrentPath("/upload")} style={{ cursor: 'pointer', color: currentPath === "/upload" ? 'var(--accent-color)' : 'inherit' }}>
             📁 upload
          </li>
          <li onClick={() => setCurrentPath("/")} style={{ cursor: 'pointer', color: currentPath === "/" ? 'var(--accent-color)' : 'inherit' }}>
             📁 root
          </li>
        </ul>
      </div>

      <div className="main-content">
        <div className="header" data-test-id="breadcrumbs">
          <button onClick={handleBack} disabled={currentPath === "/"} style={{ marginRight: 10 }}>←</button>
          <span>{currentPath}</span>
          <div style={{ marginLeft: 'auto' }}>
            <input type="file" onChange={handleUpload} style={{ display: 'none' }} id="upload-input" />
            <label htmlFor="upload-input" style={{ background: 'var(--accent-color)', padding: '5px 15px', borderRadius: 4, cursor: 'pointer' }}>Upload</label>
          </div>
        </div>

        <div className="file-view" data-test-id="file-list-view">
          {loading ? (
             <Skeleton count={5} />
          ) : (
            <>
              {error && <p style={{ color: 'var(--danger-color)' }}>{error}</p>}
              {fileList.length === 0 && <p>No files found.</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 15 }}>
                {fileList.map((item) => (
                  <div key={item.name} className="card" 
                       data-test-id={item.type === 'd' ? "dir-item" : "file-item"}>
                    <div onClick={() => item.type === 'd' ? handleNavigate(item.name) : handlePreview(item)} 
                         style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 24, marginRight: 10 }}>{item.type === 'd' ? "📁" : "📄"}</span>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                       <span>{(item.size / 1024).toFixed(1)} KB</span>
                       <div>
                         {item.type !== 'd' && <button onClick={() => handeDownload(item.name)} style={{ padding: '2px 5px' }}>⬇️</button>}
                         <button onClick={() => handleDelete(item.name)} style={{ padding: '2px 5px', color: 'var(--danger-color)' }}>🗑️</button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {uploadProgress !== null && (
        <div className="progress-container">
          <p>Uploading... {uploadProgress.toFixed(0)}%</p>
          <progress value={uploadProgress} max="100" data-test-id="upload-progress-bar" />
        </div>
      )}

      {previewFile && (
        <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} data-test-id="preview-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
               <h3>Preview: {previewFile.name}</h3>
               <button onClick={() => setPreviewFile(null)}>✖</button>
            </div>
            <div className="preview-area">
               {['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(previewFile.type) ? (
                  <img src={`/api/sftp/download?path=${encodeURIComponent(previewFile.path)}`} 
                       alt={previewFile.name} data-test-id="preview-image" />
               ) : previewContent !== null ? (
                  <pre data-test-id="preview-text">{previewContent}</pre>
               ) : (
                  <div data-test-id="preview-unsupported">
                    <p>Unsupported file type for preview.</p>
                    <p>Size: {fileList.find(f => f.name === previewFile.name)?.size} bytes</p>
                    <p>Last Modified: {new Date(fileList.find(f => f.name === previewFile.name)?.modifyTime || 0).toLocaleString()}</p>
                    <button onClick={() => handeDownload(previewFile.name)} style={{ padding: '10px 20px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 4, marginTop: 10 }}>Download File</button>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
