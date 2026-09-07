import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";

export default function LogoutPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleLogout = async () => {
            // Remember where they were before logging out
            const previousPage =
                sessionStorage.getItem("lastVisitedPage");

            if (previousPage) {
                sessionStorage.setItem(
                    "redirectAfterLogin",
                    previousPage
                );
            }

            try {
                await logout();
            } catch (error) {
                console.error("Logout failed:", error);
            }

            navigate("/login", { replace: true });
        };

        handleLogout();
    }, [navigate]);

    return <p>Logging out...</p>;
}