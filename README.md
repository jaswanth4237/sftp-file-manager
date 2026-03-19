# Secure SFTP File Manager (Next.js)

A high-performance, browser-based SFTP file manager built with Next.js 15, Node.js streams, and Docker. This application allows you to securely manage files on an SFTP server through a modern, responsive web interface without exposing SFTP credentials to the client.

## 🚀 Features

- **Secure Credential Management**: SFTP credentials are managed strictly on the server-side Next.js Route Handlers.
- **High-Performance Streaming**: 
  - **Uploads**: Uses `busboy` to stream file uploads directly from the browser to the SFTP server with a 100MB limit.
  - **Downloads**: Leverages Node.js `PassThrough` streams to pipe data directly from SFTP to the browser response.
- **Modern UI**:
  - **Directory Navigation**: Sidebar with quick-access folders and breadcrumb navigation.
  - **File Operations**: List, Upload, Download, Delete, and Preview.
  - **Smart Preview**: Real-time preview for text files and images.
  - **Skeleton Loaders**: Smooth loading transitions using React Suspense and custom Skeletons.
  - **Progress Tracking**: Real-time upload progress bars.
- **Dockerized Environment**: Fully containerized setup with a dedicated `atmoz/sftp` test server.

## 🛠️ Tech Stack

- **Frontend**: React 18, Next.js 15 (App Router), TypeScript, Vanilla CSS.
- **Backend Handlers**: Next.js Route Handlers (Node.js runtime).
- **SFTP Client**: `ssh2-sftp-client`.
- **Streaming**: Node.js `Readable`, `Writable`, and `PassThrough` streams.
- **Infrastructure**: Docker & Docker Compose.

## 📋 Prerequisites

- **Docker Desktop** installed and running on your machine.
- **Node.js 20+** (if running locally for development).

## 🚦 Getting Started

### 1. Configure Environment
Create a `.env` file if you want to override defaults (see `.env.example`).
By default, the Docker setup uses:
- **Port**: `3500` (Access at `http://localhost:3500`)
- **SFTP User**: `testuser`
- **SFTP Password**: `testpass`

### 2. Start with Docker Compose
Run the following command in the project root:

```powershell
docker-compose up --build
```

### 3. Usage
- **List Files**: Click on folders in the sidebar or breadcrumbs.
- **Upload**: Use the "Upload" button (max 100MB).
- **Preview**: Click on a file name to open the preview modal.
- **Download**: Click the ⬇️ icon next to any file.
- **Delete**: Click the 🗑️ icon to remove a file or empty directory.

## 📁 Project Structure

- `src/app/api/sftp/`: Contains the Route Handlers for file operations.
- `src/lib/sftp.ts`: Managed singleton SFTP connection pool with retry logic.
- `src/app/SFTPManager.tsx`: Main React component for the file manager UI.
- `src/app/globals.css`: Premium aesthetics and layout styles.
- `docker-compose.yml`: Multi-container orchestration (App + SFTP Server).

## 🔒 Security Considerations

- **Path Sanitization**: All incoming paths are sanitized to prevent directory traversal attacks (e.g., `../`).
- **Credential Isolation**: No SFTP username or password ever leaves the server environment.
- **Resource Limits**: 100MB upload limit enforced at the stream level to prevent memory exhaustion.

## 🧪 Testing

The application includes `data-test-id` attributes on key elements for automated testing:
- `directory-tree`
- `file-list-view`
- `breadcrumbs`
- `file-item` / `dir-item`
- `upload-progress-bar`
- `preview-panel`
