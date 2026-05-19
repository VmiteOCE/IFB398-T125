
import React from "react";

const GameEventsPage = () => {
  // Sample data (replace this with API data later)
  const data = [
    {
      game_event_id: 1,
      game_id: 100,
      event_code: "GOAL",
      zone_id: 3,
      game_clock: "12:34",
    },
    {
      game_event_id: 2,
      game_id: 100,
      event_code: "FOUL",
      zone_id: 1,
      game_clock: "10:20",
    },
    {
      game_event_id: 3,
      game_id: 101,
      event_code: "PASS",
      zone_id: 2,
      game_clock: "08:15",
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Game Events</h2>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={styles.header}>Game Event ID</th>
            <th style={styles.header}>Game ID</th>
            <th style={styles.header}>Event Code</th>
            <th style={styles.header}>Zone ID</th>
            <th style={styles.header}>Game Clock</th>
          </tr>
        </thead>

        <tbody>
          {data.map((event) => (
            <tr key={event.game_event_id}>
              <td style={styles.cell}>{event.game_event_id}</td>
              <td style={styles.cell}>{event.game_id}</td>
              <td style={styles.cell}>{event.event_code}</td>
              <td style={styles.cell}>{event.zone_id}</td>
              <td style={styles.cell}>{event.game_clock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  header: {
    border: "1px solid #ddd",
    padding: "10px",
    backgroundColor: "#f4f4f4",
    textAlign: "left",
  },
  cell: {
    border: "1px solid #ddd",
    padding: "10px",
  },
};

export default GameEventsPage;
