import { Search, Sun, Moon, LogOut, Settings, Menu } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Navbar, Form, Button, Container, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Header = ({ onSettingsClick, onSearch, onSidebarToggle }: { onSettingsClick: () => void, onSearch: (query: string) => void, onSidebarToggle?: () => void }) => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onSearch(inputValue);
        }, 500); // Debounce delay 500ms

        return () => clearTimeout(timeoutId);
    }, [inputValue, onSearch]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <Navbar className="px-3 py-2 border-bottom" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--border-color)' }}>
            <Container fluid>
                <div className="d-flex align-items-center gap-2">
                    <Button variant="link" className="p-0 d-md-none me-2" onClick={onSidebarToggle} style={{ color: 'var(--text-secondary)' }}>
                        <Menu size={24} />
                    </Button>
                    <Navbar.Brand href="/" className="d-flex align-items-center gap-2 m-0">
                         <img src="/box_1437174.png" alt="Logo" width="40" />
                        <span style={{ fontSize: '22px', color: 'var(--text-secondary)' }}>Drive</span>
                    </Navbar.Brand>
                </div>

                <div className="flex-grow-1 mx-4 d-none d-md-block" style={{ maxWidth: '700px' }}>
                    <div className="position-relative">
                        <Search className="position-absolute top-50 start-0 translate-middle-y ms-3" size={20} color="var(--text-secondary)" />
                        <Form.Control
                            type="text"
                            placeholder="Search in Drive"
                            className="border-0 rounded-pill py-2 ps-5"
                            style={{ backgroundColor: 'var(--hover-bg)', color: 'var(--text-primary)' }}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Button variant="link" onClick={toggleTheme} className="p-2 rounded-circle hover-effect">
                        {theme === 'light' ? <Moon size={24} color="var(--text-secondary)" /> : <Sun size={24} color="var(--text-secondary)" />}
                    </Button>
                    <Dropdown align="end">
                        <Dropdown.Toggle as={({ children, onClick }: any) => (
                            <div 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onClick(e);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                {children}
                            </div>
                        )} id="dropdown-profile">
                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                U
                            </div>
                        </Dropdown.Toggle>

                        <Dropdown.Menu style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
                            <Dropdown.Item onClick={onSettingsClick} className="d-flex align-items-center gap-2">
                                <Settings size={16} /> Settings
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item onClick={handleLogout} className="d-flex align-items-center gap-2 text-danger">
                                <LogOut size={16} /> Logout
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </Container>
        </Navbar>
    );
};

export default Header;
