import { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { apiFetch } from "../utils/api";

function DataExport({ showSaved, controlButtonStyle }) {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  // ------------------------------------
  // EVENT NAME CONVERSION
  // ------------------------------------
  const EVENT_NAMES = {
    P: "Pass",
    K: "Kick",
    C: "Catch",
    R: "Ruck",
    S: "Scrum",
    E: "Penalty",
    A: "Advantage",
    T: "Turnover",
    L: "Lineout",
    M: "Maul",
  };

  // ------------------------------------
  // FORMAT GAME CLOCK
  // ------------------------------------
  const formatGameClock = (seconds) => {
    if (seconds === null || seconds === undefined) {
      return "";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // ------------------------------------
  // FORMAT CSV VALUE
  // ------------------------------------
  const escapeCSVValue = (value) => {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  };

  // ------------------------------------
  // FETCH ALL GAMES
  // ------------------------------------
  useEffect(() => {
    const fetchGames = async () => {
      setGamesLoading(true);

      try {
        const res = await apiFetch("/games");
        const result = await res.json();

        if (!res.ok || result.error) {
          throw new Error(
            result.message || "Unable to load games"
          );
        }

        setGames(result.games || []);
      } catch (err) {
        console.error("Games fetch error:", err);

        if (showSaved) {
          showSaved("Unable to load games");
        }
      } finally {
        setGamesLoading(false);
      }
    };

    fetchGames();
  }, [showSaved]);

  // ------------------------------------
  // CREATE CSV
  // ------------------------------------
  const createCSV = (game, events) => {
    const csvRows = [];

    // ==================================
    // GAME INFORMATION
    // ==================================

    csvRows.push([
      "Game ID",
      "Game Name",
      "Opponent",
      "Start Time",
      "Status",
    ]);

    csvRows.push([
      game.game_id,
      game.game_name,
      game.vs_team,
      game.start_time,
      game.game_status,
    ]);

    // Empty row between sections
    csvRows.push([]);

    // ==================================
    // EVENT INFORMATION
    // ==================================

    csvRows.push([
      "Event ID",
      "Game ID",
      "Event",
      "Zone",
      "Team ID",
      "Game Clock",
      "Half",
    ]);

    events.forEach((event) => {
      csvRows.push([
        event.event_id,
        event.game_id,
        EVENT_NAMES[event.event_code] || event.event_code,
        event.zone_id,
        event.team_id,
        formatGameClock(event.game_clock),
        event.game_half,
      ]);
    });

    // ==================================
    // CONVERT TO CSV STRING
    // ==================================

    return csvRows
      .map((row) =>
        row
          .map((value) => escapeCSVValue(value))
          .join(",")
      )
      .join("\n");
  };

  // ------------------------------------
  // DOWNLOAD CSV
  // ------------------------------------
  const downloadCSV = (csvContent, gameName) => {
    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `${gameName.replace(/[^a-z0-9]/gi, "_")}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ------------------------------------
  // EXPORT SELECTED GAME
  // ------------------------------------
  const exportGameAsCSV = async (gameId) => {
    setExportingCSV(true);

    try {
      // --------------------------------
      // Get game details
      // --------------------------------
      const gameRes = await apiFetch(`/games/${gameId}`);
      const gameResult = await gameRes.json();

      if (!gameRes.ok || gameResult.error) {
        throw new Error(
          gameResult.message || "Unable to retrieve game"
        );
      }

      const game = gameResult.game;

      // --------------------------------
      // Get game events
      // --------------------------------
      const eventsRes = await apiFetch(
        `/events/game/${gameId}`
      );

      const eventsResult = await eventsRes.json();

      if (!eventsRes.ok || eventsResult.error) {
        throw new Error(
          eventsResult.message ||
            "Unable to retrieve game events"
        );
      }

      const events = eventsResult.events || [];

      // --------------------------------
      // Create CSV
      // --------------------------------
      const csvContent = createCSV(
        game,
        events
      );

      // --------------------------------
      // Download CSV
      // --------------------------------
      downloadCSV(
        csvContent,
        game.game_name
      );

      if (showSaved) {
        showSaved("CSV exported successfully");
      }

    } catch (err) {
      console.error(
        "CSV export error:",
        err
      );

      if (showSaved) {
        showSaved(
          err.message ||
            "Unable to export CSV"
        );
      }
    } finally {
      setExportingCSV(false);
    }
  };

  // ------------------------------------
  // SELECTED GAME
  // ------------------------------------
  const selectedGameDetails = games.find(
    (game) => game.game_id === selectedGame
  );

  // ------------------------------------
  // UI
  // ------------------------------------
  return (
    <div className="settings-section-panel">

      <div className="text-center mb-4">
        <h4>Data & Export</h4>

        <p className="text-muted mb-0">
          Select a game to export its match data
          as a CSV file.
        </p>
      </div>

      {gamesLoading ? (

        <div className="text-center py-4">
          <div
            className="spinner-border"
            role="status"
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>

          <p className="text-muted mt-2 mb-0">
            Loading games...
          </p>
        </div>

      ) : games.length === 0 ? (

        <div className="text-center py-4">
          <p className="text-muted mb-0">
            No games available to export.
          </p>
        </div>

      ) : (

        <>
          {/* ==========================
              GAME TABLE
          ========================== */}

          <div className="table-responsive">
            <table
              className="
                table
                table-hover
                align-middle
                settings-export-table
              "
            >

              <thead>
                <tr>

                  <th style={{ width: "80px" }}>
                    Select
                  </th>

                  <th>
                    Game
                  </th>

                  <th>
                    Opponent
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Status
                  </th>

                </tr>
              </thead>

              <tbody>

                {games.map((game) => (

                  <tr
                    key={game.game_id}
                    className={
                      selectedGame === game.game_id
                        ? "settings-export-row-selected"
                        : ""
                    }
                  >

                    {/* SELECT */}

                    <td>
                      <Form.Check
                        type="radio"
                        name="selectedGame"
                        id={`game-${game.game_id}`}
                        checked={
                          selectedGame ===
                          game.game_id
                        }
                        onChange={() =>
                          setSelectedGame(
                            game.game_id
                          )
                        }
                      />
                    </td>

                    {/* GAME */}

                    <td>
                      <label
                        htmlFor={`game-${game.game_id}`}
                        className="mb-0"
                        style={{
                          cursor: "pointer",
                        }}
                      >
                        <strong>
                          {game.game_name}
                        </strong>
                      </label>
                    </td>

                    {/* OPPONENT */}

                    <td>
                      {game.vs_team}
                    </td>

                    {/* DATE */}

                    <td>
                      {new Date(
                        game.start_time
                      ).toLocaleDateString()}
                    </td>

                    {/* STATUS */}

                    <td>
                      {game.game_status}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>
          </div>

          {/* ==========================
              SELECTED GAME
          ========================== */}

          {selectedGameDetails && (
            <div className="settings-export-selected mt-3">

              <strong>
                Selected Game:
              </strong>{" "}

              {selectedGameDetails.game_name}

            </div>
          )}

          {/* ==========================
              EXPORT BUTTON
          ========================== */}

          <div className="text-center mt-4">

            <Button
              className="settings-danger-button"
              style={controlButtonStyle}
              disabled={
                selectedGame === null ||
                exportingCSV
              }
              onClick={() =>
                exportGameAsCSV(
                  selectedGame
                )
              }
            >

              {exportingCSV
                ? "Exporting..."
                : selectedGame === null
                  ? "Select a Game"
                  : "Export as CSV"}

            </Button>

          </div>
        </>
      )}

    </div>
  );
}

export default DataExport;