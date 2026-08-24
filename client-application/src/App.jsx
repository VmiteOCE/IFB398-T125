
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { Container } from "react-bootstrap";
import "./App.css";

import Header from "./components/Header";
import Footer from "./components/Footer";

import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login";
import EventCapture from "./pages/EventCapture";
import GameEventsPage from "./pages/GameEventsPage";
import SettingsPage from "./pages/Settings";
import LogoutPage from "./pages/Logout";

// Shared page layout used across all routes
function AppLayout() {
    return (
        <div className="app-layout">
            <Header />

            <Container className="page-content">
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

            {
                element: <ProtectedRoute />,
                children: [
                    { path: "dashboard", Component: Dashboard },
                    { path: "event-capture", Component: EventCapture },
                    { path: "event-capture/:id", Component: EventCapture },
                    { path: "game-events", Component: GameEventsPage },
                    { path: "game-events/:id", Component: GameEventsPage },
                    { path: "settings", Component: SettingsPage },
                    { path: "logout", Component: LogoutPage }
                ]
            }
        ]
    }
]);

// Render the router so the correct page is shown based on the current URL
function App() {
    return <RouterProvider router={router} />;
}

export default App;
