export async function checkAuth() {
    try {
        const response = await fetch("/user/verify");

        return response.ok;
    } catch (error) {
        console.error("Authentication check failed:", error);
        return false;
    }
}

export async function logout() {
    const response = await fetch("/user/logout", {
        method: "POST"
    });

    if (!response.ok) {
        throw new Error("Logout failed");
    }

    sessionStorage.removeItem("redirectAfterLogin");
    sessionStorage.removeItem("lastVisitedPage");

    return true;
}