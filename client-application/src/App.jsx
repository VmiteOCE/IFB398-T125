
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { Container } from "react-bootstrap";
import "./App.css";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import EventCapture from "./pages/EventCapture";
import GameEventsPage from "./pages/GameEventsPage"; // ✅ NEW IMPORT

// Shared page layout used across all routes
function AppLayout() {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Header />

            <Container className="flex-grow-1 py-2">
                <Outlet />
            </Container>

            <Footer />
        </div>
    );
}

// Defines the application routes and maps each path to its page component
const router = createBrowserRouter([
    {
        path: "/",
        Component: AppLayout,
        children: [
            { index: true, Component: Home },
            { path: "login", Component: Login },
            { path: "event", element: <EventCapture /> },
            { path: "game-events", Component: GameEventsPage }, //default path with no ID can be removed when link with past game selection page
            { path: "game-events/:id", Component: GameEventsPage }
        ],
    },
]);

// Render the router so the correct page is shown based on the current URL
function App() {
    return <RouterProvider router={router} />;
}

export default App;
