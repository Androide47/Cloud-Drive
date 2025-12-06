import { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Badge } from 'react-bootstrap';
import { Trash2, Copy, ExternalLink } from 'lucide-react';

interface SharedLink {
    token: string;
    file_path: string;
    created_at: string;
    expires_at: string;
    is_expired: boolean;
}

export const SharedLinksList = () => {
    const [links, setLinks] = useState<SharedLink[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLinks = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8006/share/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLinks(response.data);
        } catch (error) {
            console.error("Error fetching shared links:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    const handleRevoke = async (token: string) => {
        if (!confirm("Are you sure you want to revoke this link? Anyone with the link will no longer be able to access the file.")) return;
        
        try {
            const authToken = localStorage.getItem('token');
            await axios.delete(`http://localhost:8006/share/${token}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setLinks(prev => prev.filter(l => l.token !== token));
        } catch (error) {
            console.error("Error revoking link:", error);
            alert("Failed to revoke link");
        }
    };

    const copyLink = (token: string) => {
        const link = `${window.location.origin}/share/${token}`;
        navigator.clipboard.writeText(link);
        alert("Link copied to clipboard!");
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) return <div className="text-center p-5">Loading shared links...</div>;

    if (links.length === 0) {
        return (
            <div className="text-center py-5 text-muted">
                <ExternalLink size={48} className="mb-3 opacity-50" />
                <p>You haven't shared any files yet.</p>
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm" style={{ backgroundColor: 'var(--surface-color)' }}>
            <Table hover responsive className="mb-0" style={{ color: 'var(--text-primary)' }}>
                <thead style={{ backgroundColor: 'var(--hover-bg)' }}>
                    <tr>
                        <th className="border-0 ps-4 py-3">File Path</th>
                        <th className="border-0 py-3">Created</th>
                        <th className="border-0 py-3">Expires</th>
                        <th className="border-0 py-3">Status</th>
                        <th className="border-0 pe-4 py-3 text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {links.map(link => (
                        <tr key={link.token} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td className="ps-4 align-middle font-monospace small">{link.file_path}</td>
                            <td className="align-middle small text-muted">{formatDate(link.created_at)}</td>
                            <td className="align-middle small text-muted">
                                {formatDate(link.expires_at)}
                            </td>
                            <td className="align-middle">
                                {link.is_expired ? (
                                    <Badge bg="secondary">Expired</Badge>
                                ) : (
                                    <Badge bg="success">Active</Badge>
                                )}
                            </td>
                            <td className="pe-4 text-end align-middle">
                                <Button size="sm" variant="link" onClick={() => copyLink(link.token)} title="Copy Link">
                                    <Copy size={16} />
                                </Button>
                                <Button size="sm" variant="link" className="text-danger" onClick={() => handleRevoke(link.token)} title="Revoke Link">
                                    <Trash2 size={16} />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};
