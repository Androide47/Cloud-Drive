import { useState, useEffect } from 'react';
import axios from 'axios';
import { Folder, File, FileText, Image, Video, Music, FileCode, Share2, Trash2, AlertTriangle } from 'lucide-react';
import { Dropdown, Modal, Button, Form, InputGroup, ProgressBar } from 'react-bootstrap';

interface FileItem {
    name: string;
    type: 'file' | 'directory';
}

interface FileListProps {
    refreshTrigger: number;
    viewMode: 'grid' | 'list';
    currentPath: string;
    onNavigate: (folderName: string) => void;
    searchQuery?: string;
}

export const FileList = ({ refreshTrigger, viewMode, currentPath, onNavigate, searchQuery }: FileListProps) => {
    const [items, setItems] = useState<FileItem[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    
    // Share State
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareLink, setShareLink] = useState("");
    
    // Zip Progress State
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [progress, setProgress] = useState(0);

    // Delete Confirmation State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const handleShare = async (filename: string) => {
        // ... (existing handleShare logic, not modifying this part, just context)
        const token = localStorage.getItem('token');
        const fullPath = (currentPath && !searchQuery) ? `${currentPath}/${filename}` : filename;
        
        try {
            const response = await axios.post('http://localhost:8006/share/create', 
                { path: fullPath },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const link = `${window.location.origin}/share/${response.data.token}`;
            setShareLink(link);
            setShowShareModal(true);
        } catch (error) {
            console.error("Error creating share link:", error);
            setMessage("Failed to create share link.");
        }
    };

    const handleZipDownload = async (filename: string) => {
        const token = localStorage.getItem('token');
        const fullPath = (currentPath && !searchQuery) ? `${currentPath}/${filename}` : filename;
        
        try {
            // Start Zip Job
            const response = await axios.post(`http://localhost:8006/files/zip/${encodeURIComponent(fullPath)}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const jobId = response.data.job_id;
            setShowProgressModal(true);
            setProgress(0);
            
            // Poll Status
            const interval = setInterval(async () => {
                try {
                    const statusRes = await axios.get(`http://localhost:8006/files/zip/status/${jobId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    const job = statusRes.data;
                    setProgress(job.progress);
                    
                    if (job.status === 'complete') {
                        clearInterval(interval);
                        // Trigger Download
                         // Short delay to let user see 100%
                        setTimeout(() => {
                             setShowProgressModal(false);
                             const downloadUrl = `http://localhost:8006/files/zip/download/${jobId}`;
                             downloadZipFile(downloadUrl, job.filename);
                        }, 500);
                    } else if (job.status === 'error') {
                        clearInterval(interval);
                        setShowProgressModal(false);
                        setMessage(`Error zipping file: ${job.error}`);
                    }
                } catch (err) {
                    clearInterval(interval);
                    setShowProgressModal(false);
                    setMessage("Error checking zip status.");
                }
            }, 1000);
            
        } catch (error) {
            console.error("Error starting zip job:", error);
            setMessage("Failed to start zip download.");
        }
    };

    const downloadZipFile = (url: string, filename: string) => {
        const token = localStorage.getItem('token');
        axios.get(url, {
            responseType: "blob",
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then((response) => {
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.setAttribute("download", filename); 
            document.body.appendChild(link);
            link.click();
        })
        .catch(() => setMessage("Failed to download zip file."));
    };

    const handleDownload = (filename: string) => {
        const item = items.find(i => i.name === filename);
        if (item?.type === 'directory') {
            handleZipDownload(filename);
            return;
        }

        const token = localStorage.getItem('token');
        const fullPath = (currentPath && !searchQuery) ? `${currentPath}/${filename}` : filename;

        axios.get(`http://localhost:8006/files/download/${encodeURIComponent(fullPath)}`, {
            responseType: "blob",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", filename.split('/').pop() || filename); 
                document.body.appendChild(link);
                link.click();
            })
            .catch((error) => {
                console.error("Error downloading file:", error);
                setMessage("Failed to download file.");
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    window.location.href = "/login";
                }
            });
    };

    const confirmDelete = (filename: string) => {
        setItemToDelete(filename);
        setShowDeleteModal(true);
    };

    const executeDelete = () => {
        if (!itemToDelete) return;
        const filename = itemToDelete;
        const token = localStorage.getItem('token');
        const fullPath = (currentPath && !searchQuery) ? `${currentPath}/${filename}` : filename;
        
        axios.delete(`http://localhost:8006/files/delete/${encodeURIComponent(fullPath)}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(() => {
                setMessage("Item deleted successfully.");
                setItems(prev => prev.filter(f => f.name !== filename));
                setShowDeleteModal(false);
                setItemToDelete(null);
            })
            .catch((error) => {
                console.error("Error deleting file:", error);
                setMessage("Failed to delete file.");
                setShowDeleteModal(false);
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                     window.location.href = "/login";
                }
            });
    };
    
    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get("http://localhost:8006/files/list", {
                    params: { 
                        path: currentPath,
                        q: searchQuery 
                    },
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (response.data.items) {
                    setItems(response.data.items);
                } else if (response.data.files) {
                    setItems(response.data.files.map((f: string) => ({ name: f, type: 'file' })));
                }
            } catch (error) {
                console.error("Error fetching files:", error);
                setMessage("Failed to fetch files.");
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    window.location.href = "/login";
                }
            }
        };

        fetchFiles();
    }, [refreshTrigger, currentPath, searchQuery]);

    const handleItemClick = (item: FileItem) => {
        if (item.type === 'directory') {
            onNavigate(item.name);
        } else {
            handleDownload(item.name);
        }
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        
        switch (ext) {
            case 'pdf':
            case 'doc':
            case 'docx':
            case 'odt':
            case 'xls':
            case 'xlsx':
            case 'ppt':
            case 'pptx':
            case 'pages':
            case 'numbers':
            case 'key':
            case 'txt':
            case 'rtf':
            case 'md':
            case 'csv':
                return FileText;
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'jpge':
            case 'svg':
            case 'raw':
            case 'gif':
            case 'webp':
            case 'bmp':
            case 'heic':
                return Image;
            case 'mov':
            case 'mp4':
            case 'avi':
            case 'mkv':
            case 'webm':
                return Video;
            case 'mp3':
            case 'wav':
            case 'flac':
            case 'aac':
            case 'ogg':
            case 'm4a':
                return Music;
            case 'py':
            case 'js':
            case 'ts':
            case 'tsx':
            case 'jsx':
            case 'html':
            case 'css':
            case 'scss':
            case 'java':
            case 'cpp':
            case 'c':
            case 'php':
            case 'go':
            case 'rb':
            case 'sql':
            case 'json':
            case 'xml':
            case 'yml':
            case 'yaml':
            case 'sh':
                return FileCode;
            default:
                return File;
        }
    };

    // Custom Toggle for Dropdown to use our Icon as trigger
    const CustomToggle = ({ children, onClick }: any) => (
        <div
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick(e);
            }}
            style={{ cursor: 'pointer', display: 'inline-block' }}
        >
            {children}
        </div>
    );

    return (
        <div>
            {message && <div className="alert alert-info">{message}</div>}
             
             {/* Share Modal */}
             <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Share File</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Anyone with this link can view this file for 24 hours.</p>
                    <InputGroup className="mb-3">
                        <Form.Control
                            value={shareLink}
                            readOnly
                        />
                        <Button variant="outline-secondary" onClick={() => navigator.clipboard.writeText(shareLink)}>
                            Copy
                        </Button>
                    </InputGroup>
                </Modal.Body>
             </Modal>

            {/* Zip Progress Modal */}
            <Modal show={showProgressModal} centered backdrop="static" keyboard={false}>
                <Modal.Body className="text-center p-4">
                    <Folder size={48} className="text-primary mb-3" />
                    <h5>Compressing Folder...</h5>
                    <p className="text-muted small">Please wait while we prepare your download.</p>
                    <ProgressBar now={progress} label={`${progress}%`} animated striped variant="success" />
                </Modal.Body>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-danger">Delete Item</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="bg-danger bg-opacity-10 p-3 rounded-circle">
                             <Trash2 size={24} className="text-danger" />
                        </div>
                        <div>
                             <h5 className="mb-1">Are you sure?</h5>
                             <p className="mb-0 text-muted">You are about to delete <strong>{itemToDelete}</strong>.</p>
                        </div>
                    </div>
                    <div className="alert alert-warning border-0 d-flex align-items-center gap-2">
                        <AlertTriangle size={18} />
                        <small className="fw-semibold">This action cannot be undone.</small>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={executeDelete} className="px-4">Delete Forever</Button>
                </Modal.Footer>
            </Modal>

             {items.length === 0 ? (
                <div className="text-center py-5">
                    <p style={{ color: 'var(--text-secondary)' }}>No files found. Upload some to get started!</p>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="row g-3">
                            {items.map((item, index) => (
                                <div key={index} className="col-6 col-md-4 col-lg-3 col-xl-2">
                                     <div 
                                        className="card h-100 shadow-sm border-0 position-relative" 
                                        style={{ backgroundColor: 'var(--card-bg)', transition: 'transform 0.2s' }}
                                     >
                                        <div className="card-body d-flex flex-column align-items-center justify-content-center py-4 text-center">
                                            <Dropdown>
                                                <Dropdown.Toggle as={CustomToggle}>
                                                    {item.type === 'directory' ? (
                                                        <Folder size={64} strokeWidth={1} className="mb-3 text-secondary" style={{ fill: '#e9ecef', fillOpacity: 0.2 }} />
                                                    ) : (
                                                        (() => {
                                                            const Icon = getFileIcon(item.name);
                                                            return <Icon size={64} strokeWidth={1} className="mb-3 text-primary" style={{ fill: 'currentColor', fillOpacity: 0.1 }} />;
                                                        })()
                                                    )}
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    {item.type === 'directory' ? (
                                                        <>
                                                            <Dropdown.Item onClick={() => onNavigate(item.name)}>Open</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => handleDownload(item.name)}>Download as Zip</Dropdown.Item>
                                                        </>
                                                    ) : (
                                                        <Dropdown.Item onClick={() => handleDownload(item.name)}>Download</Dropdown.Item>
                                                    )}
                                                    <Dropdown.Item onClick={() => handleShare(item.name)}><Share2 size={16} className="me-2"/> Share</Dropdown.Item>
                                                    <Dropdown.Item onClick={() => confirmDelete(item.name)} className="text-danger">Delete</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                            
                                            <div 
                                                className="text-truncate w-100 fw-normal" 
                                                style={{ color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer' }} 
                                                title={item.name}
                                                onClick={() => handleItemClick(item)}
                                            >
                                                {item.name}
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="list-group">
                            <div className="list-group-item d-flex align-items-center justify-content-between text-muted" style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)' }}>
                                <span className="ps-2">Name</span>
                                <span className="pe-2">Actions</span>
                            </div>
                            {items.map((item, index) => (
                                <div 
                                    key={index} 
                                    className="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2" 
                                    style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid var(--border-color)' }}
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <Dropdown>
                                            <Dropdown.Toggle as={CustomToggle}>
                                                {item.type === 'directory' ? (
                                                    <Folder size={20} strokeWidth={1.5} className="text-secondary" />
                                                ) : (
                                                    (() => {
                                                        const Icon = getFileIcon(item.name);
                                                        return <Icon size={20} strokeWidth={1.5} className="text-primary" />;
                                                    })()
                                                )}
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                 {item.type === 'directory' ? (
                                                     <>
                                                        <Dropdown.Item onClick={() => onNavigate(item.name)}>Open</Dropdown.Item>
                                                        <Dropdown.Item onClick={() => handleDownload(item.name)}>Download as Zip</Dropdown.Item>
                                                     </>
                                                ) : (
                                                    <Dropdown.Item onClick={() => handleDownload(item.name)}>Download</Dropdown.Item>
                                                )}
                                                <Dropdown.Item onClick={() => handleShare(item.name)}><Share2 size={16} className="me-2"/> Share</Dropdown.Item>
                                                <Dropdown.Item onClick={() => confirmDelete(item.name)} className="text-danger">Delete</Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                        
                                        <span 
                                            style={{ color: 'var(--text-primary)', cursor: 'pointer' }}
                                            onClick={() => handleItemClick(item)}
                                        >
                                            {item.name}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};