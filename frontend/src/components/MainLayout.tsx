import { Container, ProgressBar } from 'react-bootstrap';
import { FileList } from './FileList';
import Header from './Header';
import Sidebar from './Sidebar';
import UploadModal from './UploadModal';
import { ThemeProvider } from '../context/ThemeContext';
import { useState, useCallback } from 'react';
import axios from 'axios';

import SettingsModal from './SettingsModal';
import { PanelLeftClose, PanelLeftOpen, Grid, List, FolderPlus, ArrowLeft } from 'lucide-react';
import { SharedLinksList } from './SharedLinksList';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingMessage, setUploadingMessage] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentPath, setCurrentPath] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'files' | 'shared'>('files');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const handleUploadSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        setShowUploadModal(false);
    };

    // Search Handler
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };
    
    // Navigation Handlers
    const handleNavigate = (folderName: string) => {
        setCurrentPath(prev => prev ? `${prev}/${folderName}` : folderName);
    };

    const handleGoBack = () => {
        setCurrentPath(prev => {
            if (!prev) return "";
            const parts = prev.split('/');
            parts.pop();
            return parts.join('/');
        });
    };

    const handleCreateFolder = async () => {
        const folderName = prompt("Enter folder name:");
        if (!folderName) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post("http://localhost:8006/files/mkdir", {
                path: currentPath,
                folder_name: folderName
            }, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error creating folder:", error);
            alert("Failed to create folder");
        }
    };
    
    const uploadFileDirectly = useCallback(async (file: File) => {
        setUploadingMessage(`Uploading ${file.name}...`);
        setUploadProgress(0);
        try {
            const formData = new FormData();
            formData.append("file", file);
            // Upload to current path (updated backend supports this)
            // But we need to pass it as query param
            const token = localStorage.getItem('token');

            await axios.post(`http://localhost:8006/files/upload?path=${encodeURIComponent(currentPath)}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setUploadProgress(percentCompleted);
                }
            });

            setUploadingMessage(`Uploaded ${file.name} successfully!`);
            setTimeout(() => setUploadingMessage(null), 3000);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error(err);
             setUploadingMessage(`Failed to upload ${file.name}`);
             setTimeout(() => setUploadingMessage(null), 3000);
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                window.location.href = "/login";
            }
        }
    }, [currentPath]);

    // Drag and Drop Handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
           const file = files[0]; // Upload first file for now
           await uploadFileDirectly(file);
        }
    }, [uploadFileDirectly]);

    return (
        <ThemeProvider>
            <div 
                className="d-flex flex-column" 
                style={{ height: '100vh', backgroundColor: 'var(--bg-color)', position: 'relative' }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* ... Drag Overlay ... */}
                {isDragging && (
                    <div 
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(11, 87, 208, 0.1)',
                            border: '3px dashed var(--primary-color)',
                            zIndex: 1000,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <h2 style={{ color: 'var(--primary-color)' }}>Drop files to upload to {currentPath || "Home"}</h2>
                    </div>
                )}
                 
                 {/* Uploading Notification Toast */}
                 {uploadingMessage && (
                    <div 
                        className="card position-absolute bottom-0 end-0 m-4 shadow border-0" 
                        style={{ zIndex: 1050, width: '300px', backgroundColor: 'var(--surface-color)' }}
                    >
                        <div className="card-body p-3">
                            <h6 className="card-title mb-2 text-truncate" style={{ color: 'var(--text-primary)' }}>
                                {uploadingMessage}
                            </h6>
                            <ProgressBar 
                                now={uploadProgress} 
                                label={`${uploadProgress}%`} 
                                variant={uploadProgress === 100 ? "success" : "primary"}
                                animated={uploadProgress < 100}
                                style={{ height: '10px' }}
                            />
                        </div>
                    </div>
                 )}

                <Header 
                    onSettingsClick={() => setShowSettingsModal(true)} 
                    onSearch={handleSearch} 
                    onSidebarToggle={() => setMobileSidebarOpen(true)}
                />
                <div className="d-flex flex-grow-1 overflow-hidden">
                    <Sidebar 
                        onUploadClick={() => setShowUploadModal(true)} 
                        isOpen={sidebarOpen} 
                        activeView={activeTab}
                        onViewChange={setActiveTab}
                        showMobile={mobileSidebarOpen}
                        onCloseMobile={() => setMobileSidebarOpen(false)}
                    />
                    
                    <Container fluid className="p-4 overflow-auto">
                        <div className="d-flex align-items-center gap-3 mb-4">
                             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-link p-0 text-decoration-none d-none d-md-block" title={sidebarOpen ? "Hide sidebar" : "Show sidebar"} style={{ color: 'var(--text-secondary)' }}>
                                {sidebarOpen ? (
                                     <PanelLeftOpen size={24} />
                                ) : (
                                     <PanelLeftClose size={24} />
                                )}
                             </button>
                             <div className="d-flex flex-column">
                                 <h4 className="m-0" style={{ color: 'var(--text-primary)' }}>
                                    {activeTab === 'shared' ? 'Shared Links' : (searchQuery ? `Search results for "${searchQuery}"` : `My Drive ${currentPath && `/ ${currentPath}`}`)}
                                 </h4>
                             </div>
                        </div>

                        {activeTab === 'files' ? (
                            <>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                     <div className="d-flex gap-2">
                                        {(currentPath || searchQuery) && (
                                            <button 
                                                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                                                onClick={() => {
                                                    if (searchQuery) {
                                                        setSearchQuery("");
                                                    } else {
                                                        handleGoBack();
                                                    }
                                                }}
                                            >
                                                <ArrowLeft size={18} /> Back
                                            </button>
                                        )}
                                        {!searchQuery && (
                                            <button 
                                                className="btn btn-outline-primary d-flex align-items-center gap-2"
                                                onClick={handleCreateFolder}
                                            >
                                                <FolderPlus size={18} /> New Folder
                                            </button>
                                        )}
                                    </div>

                                    <div className="btn-group" role="group" aria-label="View mode">
                                        <button 
                                            type="button" 
                                            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => setViewMode('list')}
                                            title="List view"
                                        >
                                            <List size={20} />
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => setViewMode('grid')}
                                            title="Grid view"
                                        >
                                            <Grid size={20} />
                                        </button>
                                    </div>
                                </div>

                                <FileList 
                                    refreshTrigger={refreshTrigger} 
                                    viewMode={viewMode} 
                                    currentPath={currentPath}
                                    onNavigate={handleNavigate}
                                    searchQuery={searchQuery}
                                />
                            </>
                        ) : (
                            <SharedLinksList />
                        )}
                    </Container>
                </div>

                <UploadModal 
                    show={showUploadModal} 
                    onHide={() => setShowUploadModal(false)}
                    onUploadSuccess={handleUploadSuccess}
                />

                <SettingsModal 
                    show={showSettingsModal} 
                    onHide={() => setShowSettingsModal(false)} 
                    currentViewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
            </div>
        </ThemeProvider>
    );
};

export default MainLayout;
