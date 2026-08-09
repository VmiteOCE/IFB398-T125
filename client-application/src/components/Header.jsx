
import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";

export default function Header() {
    return (
        <Navbar expand="lg" className="py-2">
            <Container className="m-0">
                <Navbar.Brand as={Link} to="/">
                    <img src="/favicon.svg" width="100"></img>
                </Navbar.Brand>
            </Container>
        </Navbar>
    );
}
