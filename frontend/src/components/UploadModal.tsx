import { useState } from 'react';
import { Modal, Button, Form, ProgressBar, Alert } from 'react-bootstrap';
import axios from 'axios';
import { Upload } from 'lucide-react';

interface UploadModalProps {
    show: boolean;
    onHide: () => void;
    onUploadSuccess: () => void;
    preSelectedFile?: File | null;
}

const UploadModal = ({ show, onHide, onUploadSuccess, preSelectedFile }: UploadModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Sync preSelectedFile if provided
    if (preSelectedFile && !file) {
        setFile(preSelectedFile);
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setMessage(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file.");
            return;
        }

        setUploading(true);
        setError(null);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            const token = localStorage.getItem('token');

            await axios.post("http://localhost:8006/files/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${token}`
                },
            });

            setMessage("File uploaded successfully!");
            setTimeout(() => {
                onUploadSuccess();
                handleClose();
            }, 1000);
        } catch (err) {
            console.error(err);
            setError("Failed to upload file. Please try again.");
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                window.location.href = "/login";
            }
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setMessage(null);
        setError(null);
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Upload File</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {message && <Alert variant="success">{message}</Alert>}
                
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>Select file to upload</Form.Label>
                    <Form.Control type="file" onChange={handleFileChange} disabled={uploading} />
                </Form.Group>
                
                {file && <div className="text-center mb-3 text-muted">Selected: {file.name}</div>}

                {uploading && <ProgressBar animated now={100} label="Uploading..." />}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={uploading}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleUpload} disabled={!file || uploading} className="d-flex align-items-center gap-2">
                    <Upload size={16} /> Upload
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UploadModal;
