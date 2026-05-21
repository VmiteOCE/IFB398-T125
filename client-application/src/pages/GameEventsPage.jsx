
import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useParams } from "react-router-dom";

const GameEventsPage = () => {

  //get it from URL
  const { id } = useParams();
  const gameId = parseInt(id, 10) || 1; //sets default id to 1 for testing

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  //  Toggle dummy/API
  const USE_DUMMY_DATA = true;

  //  Dummy data
  const dummyData = [
    {
      game_event_id: 1,
      game_id: 1,
      event_code: "TRY",
      team_id: "Reds",
      zone_id: "A",
      game_clock: "12:34",
    },
    {
      game_event_id: 2,
      game_id: 1,
      event_code: "KICK",
      team_id: "Blues",
      zone_id: "M",
      game_clock: "10:20",
    },
    {
      game_event_id: 3,
      game_id: 1,
      event_code: "PASS",
      team_id: "Blues",
      zone_id: "B",
      game_clock: "08:15",
    },
  ];

  const fetchGameEvents = async () => {
    try {
      setLoading(true);

      if (USE_DUMMY_DATA) {
        setTimeout(() => {
          const filtered = dummyData.filter(
            (event) => event.game_id === gameId
          );
          setData(filtered);
          setLoading(false);
        }, 300);
        return;
      }

      //  Future API
      const response = await fetch(
        `http://localhost:5000/api/game-events?game_id=${gameId}`
      );

      const result = await response.json();
      setData(result);
      setLoading(false);

    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  
  useEffect(() => {
    fetchGameEvents();
  }, [gameId]);


  //  Extract teams for title
  const teams = [...new Set(data.map((e) => e.team_id))];

  const gameTitle =
    teams.length >= 2
      ? `${teams[0]} vs ${teams[1]}`
      : teams[0] || "Game";

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
      {/*  HEADER */}
      <div className="text-center mb-3">
        <h3>{gameTitle}</h3>
        <h5 style={{ opacity: 0.8 }}>Game ID: {gameId}</h5>

        {/*  Refresh Button */}
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

      {/*  TABLE PANEL */}
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
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
            }}
          >
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
                    key={event.game_event_id}
                    style={{
                      //  Reds = red, everything else = blue
                      background:
                        event.team_id?.toLowerCase() === "reds"
                          ? "#b30000"
                          : "#0033cc",
                      color: "white",
                    }}
                  >
                    <td style={styles.cell}>
                      {event.game_event_id}
                    </td>
                    <td style={styles.cell}>
                      {event.team_id}
                    </td>
                    <td style={styles.cell}>
                      {event.event_code}
                    </td>
                    <td style={styles.cell}>
                      {event.zone_id}
                    </td>
                    <td style={styles.cell}>
                      {event.game_clock}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
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
