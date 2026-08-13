import { useEffect, useState} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Col, Collapse, Form, Row } from "react-bootstrap";
import GameForm from "../components/GameForm";

const DEFAULT_GAME_FILTERS = {
    search: "",
    status: "",
    start: "",
    end: "",
    sortBy: "start_time",
    sortOrder: "asc",
    page: "1",
    limit: "20",
};

function filtersFromSearchParams(searchParams) {
    return {
        search:
            searchParams.get("search") ?? DEFAULT_GAME_FILTERS.search,

        status:
            searchParams.get("status") ?? DEFAULT_GAME_FILTERS.status,

        start:
            searchParams.get("start") ?? DEFAULT_GAME_FILTERS.start,

        end:
            searchParams.get("end") ?? DEFAULT_GAME_FILTERS.end,

        sortBy:
            searchParams.get("sortBy") ?? DEFAULT_GAME_FILTERS.sortBy,

        sortOrder:
            searchParams.get("sortOrder") ?? DEFAULT_GAME_FILTERS.sortOrder,

        page:
            searchParams.get("page") ?? DEFAULT_GAME_FILTERS.page,

        limit:
            searchParams.get("limit") ?? DEFAULT_GAME_FILTERS.limit,
    };
}

function buildGameSearchParams(filters) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (!value) return;

        params.set(key, value);
    });

    return params;
}

// Request Games ------------------------------------------
async function requestGames(filters, signal) {
    const params = buildGameSearchParams(filters);
    const queryString = params.toString();

    const response = await fetch(queryString ? `/games?${queryString}` : "/games", { signal });

    const data = await response
        .json()
        .catch(() => null);

    if (!response.ok || data?.error) {
        throw new Error( data?.message || `Failed to fetch games. Status: ${response.status}`);
    }

    return data;
}


export default function Dashboard() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openGameId, setOpenGameId] = useState(null);

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams));

    const navigate = useNavigate();

    const statusLabels = {
        scheduled: "Scheduled",
        in_progress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled"
    };

    // Fetch Games ------------------------------------------
    async function fetchGames(filtersToUse = filters) {
        try {
            setLoading(true);
            setError("");

            const data = await requestGames(filtersToUse);
            setGames(Array.isArray(data?.games) ? data.games : []);
        } catch (error) {
            console.error("Fetch games error:", error);

            setGames([]);

            setError(error.message || "Unknown error fetching games");
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

        const suffix = day % 10 === 1 && day !== 11 ? "st"
            : day % 10 === 2 && day !== 12 ? "nd"
            : day % 10 === 3 && day !== 13 ? "rd"
            : "th";

        const month = date.toLocaleDateString("en-AU", { month: "short" });
        const year = date.getFullYear();

        return `${time} ${weekday} ${day}${suffix} ${month}, ${year}`;
    }

    // Fetch Games-------------------------------------------
    useEffect(() => {
        const controller = new AbortController();
        const nextParams = buildGameSearchParams(filters);
        setSearchParams(nextParams, { replace: true });

        async function loadGames() {
            try {
                const data = await requestGames(filters, controller.signal);
                if (controller.signal.aborted) return;

                setGames(Array.isArray(data?.games) ? data.games : []);
                setError("")
                setLoading(false)
            } catch (error) {
                if (error.name === "AbortError") return;

                console.error("Fetch games error:", error);

                setGames([]);
                setError(error.message || "Unknown error fetching games");
                setLoading(false);
            }
        }

        loadGames();
        return () => {controller.abort()}
    }, [filters, setSearchParams]);

    // Change Filter ----------------------------------------
    function handleFilterChange(event) {
        const { name, value } = event.target;
        setFilters((currentFilters) => ({ ...currentFilters, [name]: value, page: "1" }));
    }

    // Clear Filter -----------------------------------------
    function clearFilters() {
        setFilters({ ...DEFAULT_GAME_FILTERS });
        setShowAdvancedFilters(false);
    }

    // Delete Game -------------------------------------------
    async function handleDeleteGame(gameId) {
        const confirmDelete = window.confirm("Delete this game?")
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/games/${gameId}`, { method: "DELETE" });
            const data = await response.json().catch(() => null);
            console.log("Delete response:", data);

            if (!response.ok) {
                throw new Error(data?.message || `Failed to delete game. Status: ${response.status}`);
            }

            setGames((currentGames) => currentGames.filter((game) => game.id !== gameId));
            setOpenGameId(null);
            await fetchGames();
        } catch (error) {
            console.error("Delete game error:", error);
            setError(error.message || "Unknown error deleting game");
        }
    }

    return (
        <div className="dashboard-content">
            <div className="dashboard-toolbar">
                <div className="dashboard-toolbar-top">
                    <GameForm
                        onSaved={fetchGames}
                        buttonText="Create Game"
                        buttonClassName="dashboard-create-button"
                    />
                </div>
                <Form className="w-100">
                    <Row className="g-2 align-items-end">
                        <Col xs={12} md={6} lg={4}>
                            <Form.Group controlId="game-search">
                                <Form.Label>Search</Form.Label>

                                <Form.Control
                                    type="search"
                                    name="search"
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                    placeholder="Game or opponent"
                                />
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6} lg={3}>
                            <Form.Group controlId="game-sort-by">
                                <Form.Label>Sort by</Form.Label>

                                <Form.Select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                                    <option value="start_time">Start time</option>
                                    <option value="game_name">Game name</option>
                                    <option value="vs_team">Opponent</option>
                                    <option value="game_status">Status</option>
                                    <option value="game_id">Game ID</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6} lg={2}>
                            <Form.Group controlId="game-sort-order">
                                <Form.Label>Order</Form.Label>

                                <Form.Select name="sortOrder" value={filters.sortOrder} onChange={handleFilterChange}>
                                    <option value="asc"> Ascending </option>
                                    <option value="desc"> Descending </option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col xs={12} md={6} lg={3}>
                            <div className="dashboard-filter-buttons">
                                <Button type="button" onClick={() => setShowAdvancedFilters((current) => !current)} aria-controls="advanced-game-filters" aria-expanded={showAdvancedFilters}> {showAdvancedFilters ? "Hide Filters" : "More Filters"} </Button>
                                <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
                            </div>
                        </Col>
                    </Row>

                    <Collapse in={showAdvancedFilters}>
                        <div id="advanced-game-filters">
                            <Row className="g-2 mt-2">
                                <Col xs={12} md={4}>
                                    <Form.Group controlId="game-status">
                                        <Form.Label>Status</Form.Label>

                                        <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                                            <option value="">All statuses</option>
                                            <option value="scheduled">Scheduled</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>

                                <Col xs={12} md={4}>
                                    <Form.Group controlId="game-start">
                                        <Form.Label>Start date</Form.Label>

                                        <Form.Control
                                            type="datetime-local"
                                            name="start"
                                            value={filters.start}
                                            onChange={handleFilterChange}
                                        />
                                    </Form.Group>
                                </Col>

                                <Col xs={12} md={4}>
                                    <Form.Group controlId="game-end">
                                        <Form.Label>End date</Form.Label>

                                        <Form.Control
                                            type="datetime-local"
                                            name="end"
                                            value={filters.end}
                                            onChange={handleFilterChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>
                    </Collapse>
                </Form>
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
                            <span>{statusLabels[game.game_status] ?? game.game_status}</span>
                        </button>

                        {openGameId === game.game_id && (
                            <div className="dashboard-actions">
                                <div className="dashboard-actions-left">
                                    <button onClick={() => handleDeleteGame(game.game_id)}>Delete</button>
                                    <GameForm gameId={game.game_id} onSaved={fetchGames}/>
                                </div>

                                <div className="dashboard-actions-right">
                                    <button onClick={() => navigate(`/event-capture/${game.game_id}`)}>Capture</button>
                                    <button onClick={() => navigate(`/game-events/${game.game_id}`)}>Stats</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}