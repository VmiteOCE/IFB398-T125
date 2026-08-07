import { useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Button, Form, Modal, Spinner,} from "react-bootstrap";

const emptyGame = {
    game_name: "",
    vs_team: "",
    start_time: "",
    game_status: "scheduled",
};

function toDateTimeInput(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 16);
    }

    const offset = date.getTimezoneOffset() * 60_000;

    return new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
}

export default function GameForm({gameId, onSaved, buttonText, buttonClassName}) {
    const params = useParams();

    const resolvedGameId = gameId ?? params.gameId ?? params.id ?? null;
    const isEditing = resolvedGameId !== null;

    const [show, setShow] = useState(false);
    const [game, setGame] = useState(emptyGame);
    const [loadingGame, setLoadingGame] = useState(false);
    const [saving, setSaving] = useState(false);
    const [validated, setValidated] = useState(false);
    const [error, setError] = useState("");

    async function openForm() {
        setShow(true);
        setError("");
        setValidated(false);

        if (!isEditing) {
            setGame(emptyGame);
            return;
        }

        try {
            setLoadingGame(true);

            const response = await fetch(`/games/${resolvedGameId}`);
            const data = await response.json().catch(() => null);

            if (!response.ok || data?.error)
                throw new Error(data?.message || `Failed to fetch game. Status: ${response.status}`);


            if (!data?.game)
                throw new Error("Game data was not returned.");

            setGame({
                game_name: data.game.game_name ?? "",
                vs_team: data.game.vs_team ?? "",
                start_time: toDateTimeInput(data.game.start_time),
                game_status: data.game.game_status ?? "scheduled",
            });
        } catch (err) {
            console.error("Fetch game error:", err);
            setError(err.message || "Unknown error fetching game");
        } finally {
            setLoadingGame(false);
        }
    }

    function closeForm() {
        if (saving) return;

        setShow(false);
        setError("");
        setValidated(false);
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setGame((currentGame) => ({ ...currentGame, [name]: value}));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        event.stopPropagation();

        const form = event.currentTarget;

        if (!form.checkValidity()) {
            setValidated(true);
            return;
        }

        try {
            setSaving(true);
            setError("");

            const endpoint = isEditing ? `/games/update/${resolvedGameId}` : "/games";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    game_name: game.game_name.trim(),
                    vs_team: game.vs_team.trim(),
                    start_time: game.start_time,
                    game_status: game.game_status,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || data?.error)
                throw new Error( data?.message || `Failed to save game. Status: ${response.status}`);

            setShow(false);
            setValidated(false);

            if (!isEditing)
                setGame(emptyGame);

            if (typeof onSaved === "function")
                await onSaved(data);
        } catch (err) {
            console.error("Save game error:", err);
            setError(err.message || "Unknown error saving game");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <button type="button" className={buttonClassName} onClick={openForm}>{buttonText ?? (isEditing ? "Edit" : "Create Game")}</button>

            <Modal
                show={show}
                onHide={closeForm}
                centered
                backdrop={saving ? "static" : true}
                keyboard={!saving}
            >
                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                    <Modal.Header closeButton={!saving}>
                        <Modal.Title>{isEditing ? "Edit Game" : "Create Game"}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {error && (
                            <Alert variant="danger">{error}</Alert>
                        )}

                        {loadingGame ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" />
                                <div className="mt-2">Loading game...</div>
                            </div>
                        ) : (
                            <>
                                <Form.Group className="mb-3" controlId="game-name">
                                    <Form.Label>Game name</Form.Label>

                                    <Form.Control
                                        type="text"
                                        name="game_name"
                                        value={game.game_name}
                                        onChange={handleChange}
                                        required
                                        disabled={saving}
                                    />

                                    <Form.Control.Feedback type="invalid">Enter a game name.</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="game-opponent">
                                    <Form.Label>Opponent</Form.Label>

                                    <Form.Control
                                        type="text"
                                        name="vs_team"
                                        value={game.vs_team}
                                        onChange={handleChange}
                                        required
                                        disabled={saving}
                                    />

                                    <Form.Control.Feedback type="invalid">Enter an opponent.</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="game-start-time">
                                    <Form.Label>Start time</Form.Label>

                                    <Form.Control
                                        type="datetime-local"
                                        name="start_time"
                                        value={game.start_time}
                                        onChange={handleChange}
                                        required
                                        disabled={saving}
                                    />

                                    <Form.Control.Feedback type="invalid">Enter a start time.</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="game-status">
                                    <Form.Label>Status</Form.Label>

                                    <Form.Select name="game_status" value={game.game_status} onChange={handleChange} required disabled={saving}>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="in_progress">In progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </Form.Select>
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={closeForm}
                            disabled={saving}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={saving || loadingGame}
                        >
                            {saving && (
                                <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-2"
                                />
                            )}

                            {
                                saving ? "Saving..."
                                    : isEditing ? "Save Changes"
                                    : "Create Game"
                            }
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
}