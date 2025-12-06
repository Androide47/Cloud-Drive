# ☁️ Cloud Drive

**Cloud Drive** is an open-source, self-hosted file management system designed for those who want to build their own private NAS or Cloud storage. Take full control of your data with a beautiful, modern interface and powerful features.

![Cloud Drive Dashboard](https://via.placeholder.com/800x400?text=Cloud+Drive+Dashboard)

## ✨ Features

- **📂 Smart File Management**: Upload, organize, rename, and delete files with ease.
- **🔗 Secure Link Sharing**: Generate time-limited share links to share files securely with anyone.
- **🎨 Modern UI/UX**:
  - **Dark/Light Modes**: Seamlessly switch between themes.
  - **Grid & List Views**: Customize how you view your files.
  - **Responsive Design**: Fully functional on Desktop, Tablet, and Mobile.
- **🛠️ Client App (Coming Soon)**: 
  - **Disk Mounter**: Mount your Cloud Drive directly to your OS (Windows, macOS, Linux) as a local disk. *Note: This feature is curently a Work in Progress.*
- **🔒 Security**: Built with robust authentication (JWT) and receiving regular security updates.

## 🚀 Deployment with Docker

You can easily deploy Cloud Drive using Docker Compose.

### Prerequisites
- Docker
- Docker Compose

### Fast Start

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Androide47/Cloud-Drive.git
    cd Cloud-Drive
    ```

2.  **Run with Docker Compose:**
    Create a `docker-compose.yml` file (or use the one provided) and run:
    ```bash
    docker-compose up -d --build
    ```

3.  **Access the App:**
    - Frontend: `http://localhost:5173`
    - Backend API: `http://localhost:8006`

### Sample `docker-compose.yml`

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8006:8006"
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/data:/app/data
    environment:
      - SECRET_KEY=change_this_secret_key_in_production
      - ALGORITHM=HS256

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

## ⚠️ Status & Security

**Status**: 🟢 Active Development
**Security**: 🛡️ Receiving Updates

This project is actively maintained. We prioritize security and regularly push updates to patch vulnerabilities and improve authentication mechanisms. 

## 🗺️ Roadmap

- [x] File Upload & Management
- [x] Folder Structure
- [x] Share Links
- [x] Dark Mode
- [x] Mobile Responsive
- [ ] **Client Disk Mounter (Native App)** - *In Progress*
- [ ] Offline Mode Support (PWA)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
