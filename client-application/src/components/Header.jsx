
import { Container, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Header() {
    return (
        <Navbar expand="lg" className="py-2">
            <Container className="header-container">
                <Navbar.Brand as={Link} to="/dashboard">
                    <img src="/favicon.svg" width="100"></img>
                </Navbar.Brand>
                
                <Link to="/settings" className="settings-link">
                    <img src="/settings-cog.svg" className="settings-cog-icon" />
                </Link>
            </Container>
        </Navbar>
    );
}
