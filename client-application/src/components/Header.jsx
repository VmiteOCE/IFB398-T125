
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";

export default function Header() {
    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm py-3">
            <Container>

                <Navbar.Brand as={Link} to="/">
                    Reds App
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="main-navbar" />

                <Navbar.Collapse id="main-navbar">
                    <Nav className="me-auto">
                        <Nav.Link as={NavLink} to="/">
                            Home
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/login">
                            Login
                        </Nav.Link>

                        <Nav.Link as={NavLink} to="/event-capture">
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
