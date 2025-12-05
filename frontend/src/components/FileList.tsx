import axios from 'axios'
import { useState, useEffect } from 'react'
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';

export const FileList = () => {
    const [files, setFiles] = useState<string[]>([]);
    const [message, setMessage] = useState<string | null>(null);

    const handleDownload = (filename: string) => {
        axios.get(`http://localhost:8006/files/download/${filename}`, {
            responseType: "blob",
        })
            .then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", filename);
                document.body.appendChild(link);
                link.click();
            })
            .catch((error) => {
                console.error("Error downloading file:", error);
                setMessage("Failed to download file.");
            });
    };

    const handleDelete = (filename: string) => {
        axios.delete(`http://localhost:8006/files/delete/${filename}`)
            .then(() => {
                setMessage("File deleted successfully.");
            })
            .catch((error) => {
                console.error("Error deleting file:", error);
                setMessage("Failed to delete file.");
            });
    };

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await axios.get("http://localhost:8006/files/list");
                setFiles(response.data.files);
            } catch (error) {
                console.error("Error fetching files:", error);
                setMessage("Failed to fetch files.");
            }
        };

        fetchFiles();
    }, []);

    return (
        <div>
            <h2>File List</h2>
            {message && <p>{message}</p>}
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>File Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map((file, index) => (
                        <tr key={index}>
                            <td>{file}</td>
                            <td>
                                <Button variant="outline-secondary" onClick={() => handleDownload(file)}>
                                    Download
                                </Button>
                                <Button variant="outline-danger" onClick={() => handleDelete(file)}>
                                    Delete
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};