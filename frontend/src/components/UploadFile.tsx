import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import axios from 'axios';
import { useState } from 'react';

export const UploadFile = () => {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setMessage(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage("Please select a file to upload.");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await axios.post("http://localhost:8006/files/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setMessage(response.data.message);
        } catch (error) {
            console.error("Error uploading file:", error);
            setMessage("Failed to upload file.");
        }
    };

    return (
        <InputGroup className="mb-3">
            <Form.Control
                type="file"
                placeholder="Select file"
                aria-label="Select file"
                aria-describedby="basic-addon2"
                onChange={handleFileChange}
            />
            <Button variant="outline-secondary" id="button-addon2" onClick={handleUpload}>
                Upload
            </Button>
        </InputGroup>
    )
}
