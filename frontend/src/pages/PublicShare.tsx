import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FileText, Download, AlertCircle, Folder } from 'lucide-react';

interface ShareInfo {
    filename: string;
    size: number;
    is_dir: boolean;
    expires_at: string;
}

const PublicShare = () => {
    const { token } = useParams<{ token: string }>();
    const [info, setInfo] = useState<ShareInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const response = await axios.get(`http://localhost:8006/share/${token}/info`);
                setInfo(response.data);
            } catch (err) {
                if (axios.isAxiosError(err) && err.response?.status === 410) {
                     setError("This link has expired.");
                } else if (axios.isAxiosError(err) && err.response?.status === 404) {
                    setError("Link or file not found.");
                } else {
                    setError("Failed to load shared file info.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchInfo();
    }, [token]);

    const handleDownload = () => {
        if (!token) return;
        window.location.href = `http://localhost:8006/share/${token}/download`;
    };

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-primary" role="status"></div>
        </div>;
    }

    if (error) {
        return <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-danger">
            <AlertCircle size={48} className="mb-3" />
            <h4>{error}</h4>
        </div>;
    }

    if (!info) return null;

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div className="card shadow-lg p-5 text-center" style={{ maxWidth: '500px', width: '90%', borderRadius: '16px' }}>
                <div className="mb-4 d-flex justify-content-center">
                    <div className="bg-primary bg-opacity-10 p-4 rounded-circle">
                         {info.is_dir ? <Folder size={48} className="text-primary" /> : <FileText size={48} className="text-primary" />}
                    </div>
                </div>
                <h3 className="mb-2 text-break">{info.filename}</h3>
                <p className="text-muted mb-4">{formatSize(info.size)} • Expires {new Date(info.expires_at).toLocaleDateString()}</p>
                
                <button onClick={handleDownload} className="btn btn-primary btn-lg d-flex align-items-center justify-content-center gap-2 w-100 rounded-pill">
                    <Download size={20} /> Download
                </button>
            </div>
        </div>
    );
};

export default PublicShare;
