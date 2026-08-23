import { useState } from "react";
import { Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);


        try {
            const response = await fetch("/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setSuccess("");
                setError(data.message || "Login failed.");
                return;
            }

            setError("");
            setSuccess("Success. Redirecting to dashboard.");
            console.log("Login successful:", data);

            // Store token

            setTimeout(() => {
                navigate("/dashboard");
            }, 1500);

        } catch (err) {
            setSuccess("");
            setError("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-box">
                <h1>Login</h1>

                <Form onSubmit={handleSubmit}>
                    <div className="login-content">

                        <div className="login-field">
                            <label htmlFor="username">Email</label>
                            <input
                                id="username"
                                type="username"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="login-field">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </button>

                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="login-success">
                                {success}
                            </div>
                        )}
                    </div>
                </Form>
            </div>
        </div>
    );
}