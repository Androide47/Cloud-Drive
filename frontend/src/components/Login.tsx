import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, InputGroup } from 'react-bootstrap';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new URLSearchParams();
        // Backend expects 'username' field, but conceptually it is an Email in this system
        // based on previous code context. Keeping 'username' key for API compatibility.
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await axios.post('http://localhost:8006/auth/token', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const token = response.data.access_token;
            localStorage.setItem('token', token);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
            <Card className="shadow-lg border-0" style={{ width: '400px', backgroundColor: 'var(--surface-color)' }}>
                <Card.Body className="p-5">
                    <div className="text-center mb-4">
                        <img src="/box_1437174.png" alt="Logo" width="60" className="mb-3" />
                        <h3 className="fw-bold" style={{ color: 'var(--text-primary)' }}>Sign in</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>to continue to Drive</p>
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formBasicUsername">
                            <Form.Label style={{ color: 'var(--text-primary)' }}>Email</Form.Label>
                            <InputGroup>
                                <InputGroup.Text style={{ backgroundColor: 'var(--hover-bg)', borderRight: 'none' }}>
                                    <User size={18} color="var(--text-secondary)" />
                                </InputGroup.Text>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Enter email" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required 
                                    style={{ borderLeft: 'none' }}
                                />
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="formBasicPassword">
                            <Form.Label style={{ color: 'var(--text-primary)' }}>Password</Form.Label>
                            <InputGroup>
                                <InputGroup.Text style={{ backgroundColor: 'var(--hover-bg)', borderRight: 'none' }}>
                                    <Lock size={18} color="var(--text-secondary)" />
                                </InputGroup.Text>
                                <Form.Control
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ borderLeft: 'none', borderRight: 'none' }}
                                />
                                <Button 
                                    variant="outline-secondary"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ borderLeft: 'none' }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </Button>
                            </InputGroup>
                        </Form.Group>

                        <Button 
                            variant="primary" 
                            type="submit" 
                            className="w-100 py-2 fw-bold btn-custom-primary" 
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Login'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Login;
