import { Link } from "react-router-dom";
import { useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openGameId, setOpenGameId] = useState(null);
    const navigate = useNavigate();

    // Fetch Games ------------------------------------------
    async function fetchGames() {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`/games`);
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                if (response.status === 404 && data?.message === "No games found") {
                    setGames([]);
                    setError("");
                return;
                }

                throw new Error(`Failed to fetch games. Status: ${response.status}`);
            }

            if (data.error) {
                setGames([]);
                setError(data.message || "No games found");
                return;
            }

            console.log("Game API response:", data);
            const gamesArray =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data.games)
                    ? data.games
                    : Array.isArray(data.data)
                        ? data.data
                        : Array.isArray(data.result)
                        ? data.result
                        : [];

            setGames(gamesArray);
        } catch (err) {
            console.error("Fetch games error:", err);
            setError(err.message || "Unknown error fetching games");
        } finally {
            setLoading(false);
        }
    }

    // Format Date
    function formatGameDate(dateValue) {
        if (!dateValue) return "No date";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Invalid date";
        }

        const time = date.toLocaleTimeString("en-AU", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });

        const weekday = date.toLocaleDateString("en-AU", {
            weekday: "short",
        });

        const day = date.getDate();

        const suffix =
            day % 10 === 1 && day !== 11
            ? "st"
            : day % 10 === 2 && day !== 12
                ? "nd"
                : day % 10 === 3 && day !== 13
                ? "rd"
                : "th";

        const month = date.toLocaleDateString("en-AU", {
            month: "short",
        });

        const year = date.getFullYear();

        return `${time} ${weekday} ${day}${suffix} ${month}, ${year}`;
    }

    // Fetch Games-------------------------------------------
    useEffect(() => {
        fetchGames();
    }, []);

    // Delete Game -------------------------------------------
    async function handleDeleteGame(gameId) {
        const confirmDelete = window.confirm("Delete this game?")
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/games/delete/${gameId}`, {
                method: "DELETE",
            })

            const data = await response.json().catch(() => null);

            console.log("Delete response:", data);

            if (!response.ok) {
                throw new Error(data?.message || `Failed to delete game. Status: ${response.status}`);
            }

            setGames((currentGames) =>
                currentGames.filter((game) => game.id !== gameId)
            );

            setOpenGameId(null);
            await fetchGames();
        } catch (err) {
            console.error("Delete game error:", err);
            setError(err.message || "Unknown error deleting game");
        }
    }



    return (
            <div className="dashboard-content">
                <div className="dashboard-toolbar">
                </div>
                <div className="dashboard-table">

                    {loading && <p>Loading games...</p>}

                    {!loading && error && (
                        <p className="dashboard-message">{error}</p>
                    )}

                    {!loading && !error && games.length === 0 && (
                        <p className="dashboard-message">No games available.</p>
                    )}

                    {games.map((game) => (
                        <div className="dashboard-card" key={game.game_id}>
                            <button className="dashboard-row" onClick={() => setOpenGameId(openGameId === game.game_id ? null : game.game_id)}>
                                <span>{game.game_name}</span>
                                <span>{game.vs_team}</span>
                                <span>{formatGameDate(game.start_time)}</span>
                                <span>{game.game_status}</span>
                            </button>

                            {openGameId === game.game_id && (
                                <div className="dashboard-actions">
                                    <div className="dashboard-actions-left">
                                        <button onClick={() => handleDeleteGame(game.game_id)}>Delete</button>
                                        <button>Edit</button>
                                    </div>

                                    <div className="dashboard-actions-right">
                                        <button onClick={() => navigate(`/event-capture/${game.game_id}`)}>
                                            Capture
                                        </button>
                                        <button onClick={() => navigate(`/game-events/${game.game_id}`)}>
                                            Stats
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
    );
}