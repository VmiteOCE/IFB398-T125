
import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useParams } from "react-router-dom";

const GameEventsPage = () => {
  const { id } = useParams();
  const gameId = parseInt(id, 10) || 1;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: game info
  const [gameInfo, setGameInfo] = useState(null);

  // Format seconds → mm:ss
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // FETCH GAME INFO
  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`/games/${gameId}`);
        const result = await res.json();

        if (!res.ok || result.error) {
          throw new Error(result.message);
        }

        setGameInfo(result.game);
      } catch (err) {
        console.error("Game fetch error:", err);
      }
    };

    fetchGame();
  }, [gameId]);

  // FETCH EVENTS
  const fetchGameEvents = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/events/${gameId}`);
      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || "Failed to fetch");
      }

      const eventsArray = Array.isArray(result.events)
        ? result.events
        : [];

      const mappedEvents = eventsArray.map((e) => ({
        event_id: e.event_id,
        team_id: e.team_id,
        team_name:
          e.team_id === 1
            ? "Reds"
            : gameInfo?.vs_team || "Away",
        event_code: e.event_code,
        zone_id: e.zone_id,
        formatted_time: formatTime(e.game_clock),
      }));

      setData(mappedEvents);
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setData([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameEvents();
  }, [gameId, gameInfo]);

  // TITLE (now from DB)
  const gameTitle = gameInfo
    ? `Reds vs ${gameInfo.vs_team}`
    : "Game";

  const zones = ["A", "B", "M", "C", "D"];

  const redsEvents = data.filter((e) => e.team_id === 1);
  const awayEvents = data.filter((e) => e.team_id !== 1);

  const countZones = (events) => {
    const counts = {};
    zones.forEach((z) => (counts[z] = 0));

    events.forEach((event) => {
      if (counts[event.zone_id] !== undefined) {
        counts[event.zone_id]++;
      }
    });

    return counts;
  };

  const redZoneCounts = countZones(redsEvents);
  const awayZoneCounts = countZones(awayEvents);

  const zoneStats = zones.map((zone) => {
    const redTotal = redsEvents.length || 1;
    const awayTotal = awayEvents.length || 1;

    return {
      zone,
      redPercent: (redZoneCounts[zone] / redTotal) * 100,
      awayPercent: (awayZoneCounts[zone] / awayTotal) * 100,
    };
  });

  return (
    <Container
      fluid
      style={{
        backgroundColor: "#5a1f28",
        minHeight: "100vh",
        color: "white",
        padding: "20px",
      }}
    >
      {/* HEADER */}
      <div className="text-center mb-3">
        <h3>{gameTitle}</h3>
        <h5 style={{ opacity: 0.8 }}>
          {gameInfo?.game_name || `Game ID: ${gameId}`}
        </h5>

        <button
          onClick={fetchGameEvents}
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            cursor: "pointer",
            borderRadius: "5px",
            border: "none",
          }}
        >
          Refresh Data
        </button>
      </div>

      {/* TABLE */}
      <div
        style={{
          background: "#f8f9fa",
          color: "black",
          padding: "15px",
          borderRadius: "8px",
        }}
      >
        <h5>Game Events</h5>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={styles.header}>Event ID</th>
                <th style={styles.header}>Team</th>
                <th style={styles.header}>Event</th>
                <th style={styles.header}>Zone</th>
                <th style={styles.header}>Time</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.cell}>
                    No data available
                  </td>
                </tr>
              ) : (
                data.map((event) => (
                  <tr
                    key={event.event_id}
                    style={{
                      background:
                        event.team_id === 1
                          ? "#b30000"
                          : "#0033cc",
                      color: "white",
                    }}
                  >
                    <td style={styles.cell}>{event.event_id}</td>
                    <td style={styles.cell}>{event.team_name}</td>
                    <td style={styles.cell}>{event.event_code}</td>
                    <td style={styles.cell}>{event.zone_id}</td>
                    <td style={styles.cell}>{event.formatted_time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ZONE ANALYTICS */}
      <div
        style={{
          marginTop: "20px",
          background: "#f8f9fa",
          color: "black",
          padding: "15px",
          borderRadius: "8px",
        }}
      >
        <h5>Zone Distribution (%)</h5>

        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={styles.header}>Zone</th>
              <th style={styles.header}>Reds (%)</th>
              <th style={styles.header}>
                {gameInfo?.vs_team || "Away"} (%)
              </th>
            </tr>
          </thead>
          <tbody>
            {zoneStats.map(({ zone, redPercent, awayPercent }) => (
              <tr key={zone}>
                <td style={styles.cell}>{zone}</td>

                <td
                  style={{
                    ...styles.cell,
                    backgroundColor: "#b30000",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {redPercent.toFixed(1)}%
                </td>

                <td
                  style={{
                    ...styles.cell,
                    backgroundColor: "#0033cc",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {awayPercent.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
};

const styles = {
  header: {
    textAlign: "left",
    padding: "10px",
    borderBottom: "2px solid #ccc",
  },
  cell: {
    padding: "10px",
  },
};

export default GameEventsPage;
