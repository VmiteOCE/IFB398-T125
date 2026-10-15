const API_URL = import.meta.env.VITE_API_URL || ""; // Fallback to local dev server

export async function apiFetch(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
    
    // Pass cookies/session credentials by default if applicable
    options.credentials = options.credentials || "include";

    const response = await fetch(url, options);
    return response;
}