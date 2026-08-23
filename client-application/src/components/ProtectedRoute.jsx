import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { checkAuth } from "../utils/auth";

export default function ProtectedRoute() {
    const location = useLocation();
    const [authStatus, setAuthStatus] = useState("checking");

    useEffect(() => {
        const verifyUser = async () => {
            setAuthStatus("checking");

            const authenticated = await checkAuth();

            if (!authenticated) {
                const originalUrl = location.pathname + location.search + location.hash;
                sessionStorage.setItem("redirectAfterLogin", originalUrl);
                setAuthStatus("unauthenticated");
                return;
            }

            const currentUrl = location.pathname + location.search + location.hash;

            sessionStorage.setItem("lastVisitedPage", currentUrl);

            setAuthStatus("authenticated");
        };

        verifyUser();
    }, [location.pathname, location.search, location.hash]);

    if (authStatus === "checking") {
        return <p>Checking authentication...</p>;
    }

    if (authStatus === "unauthenticated") {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}