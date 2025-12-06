import React, { useState, useEffect } from 'react';
import { Plus, HardDrive, Upload, Cloud, Link as LinkIcon } from 'lucide-react';
import { Nav, Dropdown, ProgressBar, Offcanvas } from 'react-bootstrap';
import axios from 'axios';

interface SidebarProps {
    onUploadClick: () => void;
    isOpen: boolean;
    activeView: 'files' | 'shared';
    onViewChange: (view: 'files' | 'shared') => void;
    showMobile: boolean;
    onCloseMobile: () => void;
}

interface StorageData {
    total_gb: number;
    used_gb: number;
    free_gb: number;
}

type CustomToggleProps = {
    children: React.ReactNode;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

// ... (NewButtonToggle and StorageWidget remain same, but I need to include them in replacement)

// eslint-disable-next-line react/display-name
const NewButtonToggle = React.forwardRef<HTMLButtonElement, CustomToggleProps>(
    ({ children, onClick }, ref) => (
        <button
            ref={ref}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
            className="btn btn-light shadow-sm d-flex align-items-center gap-2 mb-4 px-4 py-3 rounded-pill hover-effect w-100"
            style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}
        >
            {children}
        </button>
    )
);

const StorageWidget = () => {
    const [storage, setStorage] = useState<StorageData | null>(null);

    useEffect(() => {
        const fetchStorage = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8006/files/usage', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStorage(response.data);
            } catch (error) {
                console.error("Failed to fetch storage usage", error);
            }
        };
        fetchStorage();
    }, []);

    if (!storage) return null;

    const percentage = (storage.used_gb / storage.total_gb) * 100;

    return (
        <div className="mt-4 px-3">
             <div className="d-flex align-items-center gap-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
                 <Cloud size={18} />
                 <small>Storage</small>
             </div>
             <ProgressBar 
                now={percentage} 
                variant={percentage > 90 ? "danger" : "primary"} 
                style={{ height: '6px', backgroundColor: 'var(--border-color)' }} 
            />
             <div className="mt-2 small" style={{ color: 'var(--text-secondary)' }}>
                 {storage.used_gb} GB of {storage.total_gb} GB used
             </div>
        </div>
    );
};

const SidebarContent = ({ onUploadClick, activeView, onViewChange }: { onUploadClick: () => void, activeView: 'files' | 'shared', onViewChange: (view: 'files' | 'shared') => void }) => (
    <div className="d-flex flex-column h-100">
        <Dropdown>
            <Dropdown.Toggle as={NewButtonToggle} id="dropdown-new-button">
                <Plus size={24} color="var(--text-primary)" />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>New</span>
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ backgroundColor: 'var(--surface-color)', minWidth: '200px' }}>
                    <Dropdown.Item onClick={onUploadClick} className="d-flex align-items-center gap-2 py-2">
                    <Upload size={18} /> File upload
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>

        <Nav className="flex-column gap-1 flex-grow-1">
            <Nav.Link 
                as="button"
                onClick={() => onViewChange('files')}
                className={`d-flex align-items-center gap-3 px-3 py-2 rounded-pill w-100 border-0 text-start`}
                style={{ 
                    color: 'var(--text-primary)', 
                    backgroundColor: activeView === 'files' ? 'var(--hover-bg)' : 'transparent',
                    fontWeight: activeView === 'files' ? 600 : 400
                }}
            >
                <HardDrive size={20} />
                <span>My Drive</span>
            </Nav.Link>
            
            <Nav.Link 
                as="button"
                onClick={() => onViewChange('shared')}
                className={`d-flex align-items-center gap-3 px-3 py-2 rounded-pill w-100 border-0 text-start`}
                style={{ 
                    color: 'var(--text-primary)', 
                    backgroundColor: activeView === 'shared' ? 'var(--hover-bg)' : 'transparent',
                    fontWeight: activeView === 'shared' ? 600 : 400
                }}
            >
                <LinkIcon size={20} />
                <span>Shared Links</span>
            </Nav.Link>
        </Nav>

        <StorageWidget />
    </div>
);

const Sidebar = ({ onUploadClick, isOpen, activeView, onViewChange, showMobile, onCloseMobile }: SidebarProps) => {
    // Desktop View
    if (!isOpen && !showMobile) return null;

    return (
        <>
            {/* Desktop Sidebar */}
            {isOpen && (
                <div style={{ width: '250px', padding: '16px', transition: 'width 0.3s' }} className="d-none d-md-flex flex-column h-100">
                    <SidebarContent onUploadClick={onUploadClick} activeView={activeView} onViewChange={onViewChange} />
                </div>
            )}

            {/* Mobile Sidebar (Offcanvas) */}
            <Offcanvas show={showMobile} onHide={onCloseMobile} className="d-md-none" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                <Offcanvas.Header closeButton className="border-bottom">
                    <Offcanvas.Title className="d-flex align-items-center gap-2">
                         <img src="/box_1437174.png" alt="Logo" width="30" />
                         <span>Drive</span>
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <SidebarContent onUploadClick={() => { onUploadClick(); onCloseMobile(); }} activeView={activeView} onViewChange={(v) => { onViewChange(v); onCloseMobile(); }} />
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default Sidebar;
