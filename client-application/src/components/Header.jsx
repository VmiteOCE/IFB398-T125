import { Container, Nav, Navbar, Button } from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";

export default function header() {
    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm py-3">
            <Container>

                <Navbar.Brand as={Link} to="/">
                    Reds App
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="main-navbar" />
                {/* Main navigation links. */}

                <Navbar.Collapse id="main-navbar">
                    <Nav className="me-auto">
                        <Nav.Link as={NavLink} to="/">
                            Home
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/Login">
                            Login
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/event">
                            Capture
                        </Nav.Link>
                        <Nav.Link as={NavLink} to="/game-events">
                            Game Stats
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}