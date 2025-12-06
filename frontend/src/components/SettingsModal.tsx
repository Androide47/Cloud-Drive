import { Modal, Button, Form, Tab, Tabs, Alert } from 'react-bootstrap';
import { MonitorDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

interface SettingsModalProps {
    show: boolean;
    onHide: () => void;
    currentViewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
}

const SettingsModal = ({ show, onHide, currentViewMode, onViewModeChange }: SettingsModalProps) => {
    const { theme, setTheme } = useTheme();
    const [key, setKey] = useState('profile');
    
    // ... profile state ...
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user'); // Keep existing role
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'danger' } | null>(null);
    const [osName, setOsName] = useState('Linux');
    const [language, setLanguage] = useState('en');
    
    // ... password state ...
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Fetch user info when modal opens
    useEffect(() => {
        if (show) {
            fetchUserProfile();
            // Reset fields
            setMessage(null);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        
        // Detect OS
        const userAgent = window.navigator.userAgent;
        if (userAgent.indexOf("Win") !== -1) setOsName("Windows");
        else if (userAgent.indexOf("Mac") !== -1) setOsName("macOS");
        else if (userAgent.indexOf("Linux") !== -1) setOsName("Linux");
        else setOsName("OS");

    }, [show]);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get("http://localhost:8006/auth/profile", {
                 headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const { first_name, last_name, email, role } = response.data;
            setFirstName(first_name);
            setLastName(last_name);
            setEmail(email);
            setRole(role);
        } catch (error) {
            console.error("Failed to fetch profile", error);
            // Optionally redirect to login if 401
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const token = localStorage.getItem('token');
            await axios.put("http://localhost:8006/auth/update", {
                email,
                first_name: firstName,
                last_name: lastName,
                role // Sending back the existing role (or default)
            }, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
        } catch (err) {
            console.error(err);
            setMessage({ text: 'Failed to update profile.', type: 'danger' });
             if (axios.isAxiosError(err) && err.response?.status === 401) {
                // handle auth error
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ text: 'New passwords do not match.', type: 'danger' });
            return;
        }

        if (newPassword.length < 6) {
             setMessage({ text: 'New password must be at least 6 characters.', type: 'danger' });
             return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put("http://localhost:8006/auth/change_password", {
                password: currentPassword,
                new_password: newPassword
            }, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            setMessage({ text: 'Password changed successfully!', type: 'success' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || 'Failed to change password.';
            setMessage({ text: errorMsg, type: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                <Modal.Title>Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)' }}>
                <Tabs
                    id="settings-tabs"
                    activeKey={key}
                    onSelect={(k) => {
                        setKey(k || 'profile');
                        setMessage(null);
                    }}
                    className="mb-3"
                >
                    <Tab eventKey="profile" title="Profile">
                        {message && <Alert variant={message.type}>{message.text}</Alert>}
                        <Form onSubmit={handleUpdateProfile}>
                            <Form.Group className="mb-3">
                                <Form.Label>First Name</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Enter first name" 
                                    value={firstName} 
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Enter last name" 
                                    value={lastName} 
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </Form.Group>
                             <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control 
                                    type="email" 
                                    placeholder="Enter email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </Form.Group>
                            <div className="d-flex justify-content-end">
                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </Form>
                    </Tab>
                    <Tab eventKey="security" title="Security">
                        {message && <Alert variant={message.type}>{message.text}</Alert>}
                        <Form onSubmit={handleChangePassword}>
                             <Form.Group className="mb-3">
                                <Form.Label>Current Password</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    placeholder="Enter current password" 
                                    value={currentPassword} 
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>New Password</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    placeholder="Enter new password" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Confirm New Password</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    placeholder="Confirm new password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                />
                            </Form.Group>
                             <div className="d-flex justify-content-end">
                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? 'Changing...' : 'Change Password'}
                                </Button>
                            </div>
                        </Form>
                    </Tab>
                    <Tab eventKey="general" title="General">
                         <div className="pt-3">
                            <Form.Group className="mb-4">
                                <Form.Label>Appearance</Form.Label>
                                <Form.Select 
                                    value={theme} 
                                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                >
                                    <option value="light">Light Mode</option>
                                    <option value="dark">Dark Mode</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label>Default View</Form.Label>
                                <Form.Select 
                                    value={currentViewMode} 
                                    onChange={(e) => onViewModeChange(e.target.value as 'grid' | 'list')}
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                >
                                    <option value="grid">Grid View</option>
                                    <option value="list">List View</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label>Language</Form.Label>
                                <Form.Select 
                                    value={language} 
                                    onChange={(e) => setLanguage(e.target.value)}
                                    style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                >
                                    <option value="en">English (US)</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                </Form.Select>
                            </Form.Group>
                        </div>
                    </Tab>
                    <Tab eventKey="installer" title="Client App">
                        <div className="text-center py-4">
                             <img src="/box_1437174.png" alt="Client Logo" width="80" className="mb-3" />
                             <h5>Install Cloud Drive Client</h5>
                             <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Sync files directly from your computer with our desktop app.</p>
                             
                             <Button 
                                variant="primary" 
                                className="d-flex align-items-center gap-2 mx-auto"
                                onClick={() => window.open('http://localhost:8006/installer/download', '_blank')}
                             >
                                 <MonitorDown size={20} />
                                 Download for {osName}
                             </Button>
                        </div>
                    </Tab>
                </Tabs>
            </Modal.Body>
        </Modal>
    );
};

export default SettingsModal;
