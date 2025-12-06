import React from 'react';
import { FileText, Image, Music, Video, Trash, Download, File } from 'lucide-react';
import { Dropdown } from 'react-bootstrap';

interface FileCardProps {
    filename: string;
    onDownload: (filename: string) => void;
    onDelete: (filename: string) => void;
}

const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const props = { size: 48, strokeWidth: 1.5 };
    
    switch (ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
            return <Image {...props} color="#d93025" />;
        case 'pdf':
            return <FileText {...props} color="#f40f0f" />;
        case 'mp4':
        case 'avi':
            return <Video {...props} color="#ea4335" />;
        case 'mp3':
        case 'wav':
            return <Music {...props} color="#188038" />;
        case 'txt':
        case 'doc':
        case 'docx':
            return <FileText {...props} color="#1967d2" />;
        default:
            return <File {...props} color="#5f6368" />;
    }
};

type CustomToggleProps = {
    children: React.ReactNode;
    onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

// eslint-disable-next-line react/display-name
const CustomToggle = React.forwardRef<HTMLDivElement, CustomToggleProps>(
    ({ children, onClick }, ref) => (
        <div
            ref={ref}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
            style={{ cursor: 'pointer', height: '100%' }}
        >
            {children}
        </div>
    )
);

const FileCard = ({ filename, onDownload, onDelete }: FileCardProps) => {
    return (
        <Dropdown className="h-100">
            <Dropdown.Toggle as={CustomToggle} id={`dropdown-${filename}`}>
                <div className="h-100 d-flex flex-column align-items-center justify-content-center p-3 rounded-3 file-card hover-effect-card" style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}>
                    <div className="mb-3">
                        {getFileIcon(filename)}
                    </div>
                    <span className="text-truncate text-center w-100" style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }} title={filename}>
                        {filename}
                    </span>
                </div>
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ backgroundColor: 'var(--surface-color)' }}>
                <Dropdown.Item onClick={() => onDownload(filename)} className="d-flex align-items-center gap-2">
                    <Download size={14} /> Download
                </Dropdown.Item>
                <Dropdown.Item onClick={() => onDelete(filename)} className="d-flex align-items-center gap-2 text-danger">
                    <Trash size={14} /> Delete
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default FileCard;
