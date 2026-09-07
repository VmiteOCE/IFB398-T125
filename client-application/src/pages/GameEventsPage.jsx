
import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";

import ZoneTimeGraphs from "../components/GameGraphs";

  // Format Event Time
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "-";

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  async function requestGameEvents(gameId, awayName) {
    const response = await fetch(`/events/game/${gameId}`);
    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.message || "Failed to fetch");
    }

    const eventsArray = Array.isArray(result.events)
      ? result.events
      : [];

    return eventsArray.map((e) => ({
      event_id: e.event_id,
      team_id: e.team_id,
      team_name:
        e.team_id === 1
          ? "Reds"
          : awayName || "Away",
      event_code: e.event_code,
      zone_id: e.zone_id,
      //raw time for the tables
      game_clock: e.game_clock,
      // formatted time for raw data
      formatted_time: formatTime(e.game_clock),
      game_half: e.game_half,
    }));
  }


const GameEventsPage = () => {
  const { id } = useParams();
  const gameId = parseInt(id, 10) || 1;

  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [gameInfo, setGameInfo] = useState(null);

  // Switch between table and graph analysis
  const [analysisView, setAnalysisView] = useState("table");

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

      const events = await requestGameEvents(gameId, gameInfo?.vs_team)
      setData(events);
    } catch (error) {
      console.error("Fetch error:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadGameEvents() {
      try {
        const events = await requestGameEvents(gameId, gameInfo?.vs_team);
        if (cancelled) return;

        setData(events);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;

        console.error("Fetch error:", error);
        setData([]);
        setLoading(false);
      }
    }

    loadGameEvents();

    return () => { cancelled = true;}
  }, [gameId, gameInfo?.vs_team]); // <-- removed gameInfo

  const gameTitle = gameInfo
    ? `Reds vs ${gameInfo.vs_team}`
    : "Game";

  // Zones -  in this order for tables so same as excel
  const zones = ["D", "C", "M", "B", "A"];

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

  // raw time into the intervals and halfs
  const intervals = [
  { label: "0-10", start: 0, end: 600, half:1 },
  { label: "10-20", start: 600, end: 1200, half:1 },
  { label: "20-30", start: 1200, end: 1800, half:1 },
  { label: "30-40", start: 1800, end: 2400, half:1 },
  { label: "40-50", start: 2400, end: 3000,  half:2 },
  { label: "50-60", start: 3000, end: 3600, half:2 },
  { label: "60-70", start: 3600, end: 4200, half:2},
  { label: "70-80", start: 4200, end: 4800, half:2 },
];

// Count the number of Events
const countEvents = (eventCode, teamId, zone, start, end, half) => {
  return data.filter((event) => {

        if (
      event.event_code !== eventCode ||
      event.team_id !== teamId ||
      event.zone_id !== zone ||
      event.game_half !== half
    ) {
      return false;
    }

    if (half === 1 && end === 2400) {
      return event.game_clock >= start;
    }

    if (half === 2 && end === 4800) {
      return event.game_clock >= start;
    }

    return (
      event.game_clock >= start &&
      event.game_clock < end
    );
  }).length;
};


// Calculate time spent in each zone
const getZoneTime = (teamId, zone, start, end, half) => {
  const sortedEvents = [...data]
  .filter((event) => event.game_half === half)
  .sort(  
    (a, b) =>
      a.game_clock - b.game_clock ||
      a.event_id - b.event_id
  );

  let totalSeconds = 0;

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEvent = sortedEvents[i];
    const nextEvent = sortedEvents[i + 1];

    if (
      currentEvent.event_code !== "." &&
      currentEvent.team_id === teamId &&
      currentEvent.zone_id === zone
    ) {
      const sectionStart = Math.max(
        currentEvent.game_clock,
        start
      );

      const sectionEnd =
        (half === 1 && end === 2400) ||
        (half === 2 && end === 4800)
        ? nextEvent.game_clock
        : Math.min(nextEvent.game_clock, end);

      if (sectionEnd > sectionStart) {
        totalSeconds += sectionEnd - sectionStart;
      }
    }
  }
  return totalSeconds;
};


 // Reusable analysis table
  const renderEventZoneTable  = ({ title, eventCode, cumulative = false, }) => {
    const awayName = gameInfo?.vs_team || "Away";
    return (
      <div className="analysis-table-card">
        <h5>{title}</h5>
        <table className="analysis-table">

          <thead>
            {/** The Team headings **/}
            <tr>
              <th style={styles.header}></th>
              <th
                className="reds-cell" style={styles.header} colSpan={5}>
                Reds
              </th>
              <th className="away-cell" style={styles.header} colSpan={5} >
                {awayName}
              </th>
              </tr>

            {/* Zone headings */}
            <tr>
              <th style={styles.header}>
                Interval
              </th>

              {zones.map((zone) => (
                <th
                  key={`reds-heading-${zone}`} className="reds-cell"
                  style={styles.header}
                >
                  {zone}
                </th>
              ))}

              {zones.map((zone) => (
                <th
                  key={`away-heading-${zone}`} className="away-cell"
                  style={styles.header}
                >
                  {zone}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* 10 minute interval rows */}
            {intervals.map((interval) => {
              const start = cumulative
              ? 0
              : interval.start;

              const label = cumulative
              ? `0-${interval.end / 60}`
              : interval.label;

              return (
              <tr key={label}>
                <td style={styles.cell}>
                  <strong>{label}</strong>
                  </td>

                {/* Reds */}
                {zones.map((zone) => (
                  <td
                    key={`reds-${interval.label}-${zone}`} className="reds-cell"
                    style={styles.cell}
                  >
                    {cumulative && interval.half === 2
                    ? countEvents(eventCode, 1, zone, 0, 2400, 1) +
                      countEvents(eventCode, 1, zone, 2400, interval.end, 2)
                    : countEvents(eventCode, 1, zone, start, interval.end, interval.half)}
                  </td>
                ))}

                {/* Away team */}
                {zones.map((zone) => (
                  <td
                    key={`away-${interval.label}-${zone}`} className="away-cell"
                    style={styles.cell}
                  >
                    {cumulative && interval.half === 2
                    ? countEvents(eventCode, 2, zone, 0, 2400, 1) +
                      countEvents(eventCode, 2, zone, 2400, interval.end, 2)
                    : countEvents(eventCode, 2, zone, start, interval.end, interval.half)}
                  </td>
                ))}
              </tr>
              );
              })}

            {/* The total row */}
            <tr>
              <td style={styles.cell}>
                <strong>Total</strong>
              </td>

              {/* Reds totals */}
              {zones.map((zone) => (
                <td
                  key={`reds-total-${zone}`} className="reds-cell"
                  style={styles.cell}
                >
                  <strong>
                    {countEvents(eventCode, 1, zone, 0, 2400, 1) +
                    countEvents(eventCode, 1, zone, 2400, 4800, 2)}
                  </strong>
                </td>
              ))}

              {/* Away totals */}
              {zones.map((zone) => (
                <td
                  key={`away-total-${zone}`} className="away-cell"
                  style={styles.cell}
                >
                  <strong>
                    {countEvents(eventCode, 2, zone, 0, 2400, 1) +
                    countEvents(eventCode, 2, zone, 2400, 4800, 2)}
                  </strong>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Reusable table for time spent in each zone
const renderZoneTimeTable  = ({
  title,
  cumulative = false, // for cumulative tables
  }) => {
  const awayName = gameInfo?.vs_team || "Away";

  return (
        <div className="analysis-table-card">
        <h5>{title}</h5>
        <table className="analysis-table"
        style={{tableLayout: "fixed", fontSize: "clamp(10px, 1.2vw, 16px)"}}>

        <thead>
        <tr>
          <th style={styles.header}></th>
          <th className="reds-cell" style={styles.header} colSpan={5}>
            Reds
            </th>

            <th className="away-cell" style={styles.header} colSpan={5}>
              {awayName}
              </th>
          </tr>

        <tr>
        <th style={{...styles.header,paddingLeft: "0px"}}>Interval</th>

        {zones.map((zone) => (
          <th
            className="reds-cell" key={`reds-time-heading-${zone}`} style={styles.header}
          >
            {zone}
          </th>
        ))}

        {zones.map((zone) => (
          <th
            className="away-cell" key={`away-time-heading-${zone}`}
            style={styles.header}
          >
            {zone}
          </th>
        ))}
      </tr>
</thead>

        <tbody>
          {intervals.map((interval) => {
            const start = cumulative
              ? 0
              : interval.start;

            const label = cumulative
              ? `0-${interval.end / 60}`
              : interval.label;

            return (
              <tr key={label}>
                <td style={styles.cell}>
                  <strong>{label}</strong>
                </td>


                {/* Reds */}
                {zones.map((zone) => (
                  <td
                    className="reds-cell" key={`reds-time-${label}-${zone}`} style={styles.cell}
                  >
                    {formatTime(
                      cumulative && interval.half === 2
                      ? getZoneTime(1, zone, 0, 2400, 1) +
                      getZoneTime(1, zone, 2400, interval.end, 2)
                      : getZoneTime(1, zone, start, interval.end, interval.half)
                    )}
                  </td>
                ))}

                {/* Away */}
                {zones.map((zone) => (
                  <td
                    className="away-cell" key={`away-time-${label}-${zone}`}
                    style={styles.cell}
                  >
                    {formatTime(
                      cumulative && interval.half === 2
                      ? getZoneTime(2, zone, 0, 2400, 1) +
                        getZoneTime(2, zone, 2400, interval.end, 2)
                        : getZoneTime(2, zone, start, interval.end, interval.half)
                      )}
                  </td>
                ))}
              </tr>
            );
          })}

          {/* Total row */}
          <tr>
            <td style={styles.cell}>
              <strong>Total</strong>
            </td>

            {/* Reds totals */}
            {zones.map((zone) => (
              <td
                className="reds-cell" key={`reds-time-total-${zone}`}
                style={styles.cell}
              >
                <strong>
                  {formatTime(getZoneTime(1, zone, 0, 2400, 1) + getZoneTime(1, zone, 2400, 4800, 2))}
                </strong>
              </td>
            ))}

            {/* Away totals */}
            {zones.map((zone) => (
              <td
                className="away-cell" key={`away-time-total-${zone}`}
                style={styles.cell}
              >
                <strong>
                  {formatTime(getZoneTime(2, zone, 0, 2400, 1) + getZoneTime(2, zone, 2400, 4800, 2))}
                </strong>
              </td>
            ))}
          </tr>
        </tbody>
        </table>
    </div>
  );
};

{/* A Zone Table */}
const renderAZoneTable = () => {
  const awayName = gameInfo?.vs_team || "Away";

  return (
    <div className="analysis-table-card">
      <h5>A Zone Time</h5>
      <table className="analysis-table">
        <thead>
          <tr>
          <th style={styles.header}>Interval</th>
          <th className="reds-cell" style={styles.header}>
            Reds 10'
            </th>
          <th className="reds-cell" style={styles.header}>
            Reds Total
            </th>
          <th className="away-cell" style={styles.header}>
          {awayName} 10'
          </th>
    <th className="away-cell" style={styles.header}>
      {awayName} Total
    </th>
          </tr>
        </thead>
        <tbody>
          {intervals.map((interval) => (
            <tr key={interval.label}>
              <td style={styles.cell}> {interval.label}</td>
                <td className="reds-cell" style={styles.cell}> {formatTime(getZoneTime(1, "A", interval.start, interval.end, interval.half))}
              </td>
                <td className="reds-cell" style={styles.cell}> {formatTime(  interval.half === 2
                ? getZoneTime(1, "A", 0, 2400, 1) +
                getZoneTime(1, "A", 2400, interval.end, 2)
                : getZoneTime(1, "A", 0, interval.end, 1))}
              </td>
                <td className="away-cell" style={styles.cell}> {formatTime(getZoneTime(2, "A", interval.start, interval.end, interval.half))}
              </td>
                <td className="away-cell" style={styles.cell}> {formatTime(interval.half === 2
                ? getZoneTime(2, "A", 0, 2400, 1) +
                getZoneTime(2, "A", 2400, interval.end, 2)
                : getZoneTime(2, "A", 0, interval.end, 1))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

  return (
    <Container
      fluid
      style={{
        backgroundColor: "#5a1f28",
        minHeight: "100vh",
        padding: "12px",
      }}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: "#8C5F5F",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#321A1A",
            color: "white",
            padding: "20px",
            position: "relative",
            textAlign: "center",
          }}
        >
          <button
            onClick={() => navigate("/dashboard")}
            aria-label="Go Back"
            style={{
              position: "absolute",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "white",
              fontSize: "32px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ←
          </button>

          <h2 style={{ margin: 0 }}>
            {gameTitle}
          </h2>

          <h5 style={{ marginTop: "8px", opacity: 0.8 }}>
            {gameInfo?.game_name || `Game ID: ${gameId}`}
          </h5>
        </div>

        {/* Content */}
        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={fetchGameEvents}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderRadius: "5px",
                border: "none",
              }}
            >
              Refresh Data
            </button>
          </div>

          {/* Game Events */}
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
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
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
                          key={event.event_id}
                          style={{
                            background:
                              event.team_id === 1
                                ? "#b30000"
                                : "#0033cc",
                            color: "white",
                          }}
                        >
                          <td style={styles.cell}>
                            {event.event_id}
                          </td>

                          <td style={styles.cell}>
                            {event.team_name}
                          </td>

                          <td style={styles.cell}>
                            {event.event_code}
                          </td>

                          <td style={styles.cell}>
                            {event.zone_id}
                          </td>

                          <td style={styles.cell}>
                            {event.formatted_time}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Zone Distribution */}
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

            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
              }}
            >
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
                {zoneStats.map(
                  ({
                    zone,
                    redPercent,
                    awayPercent,
                  }) => (
                    <tr key={zone}>
                      <td style={styles.cell}>
                        {zone}
                      </td>

                      <td style={styles.cell}>
                        {redPercent.toFixed(1)}%
                      </td>

                      <td style={styles.cell}>
                        {awayPercent.toFixed(1)}%
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          
      {/* GAME ANALYSIS */}
<h3
  style={{marginTop: "40px", marginBottom: "20px", textAlign: "center",}}
>
  Game Analysis
</h3>

{/* TABLE / GRAPH BUTTONS */}
<div className="analysis-view-buttons">
  <button
    onClick={() => setAnalysisView("table")}
    style={{
      backgroundColor:
        analysisView === "table"
          ? "#ff969dff"
          : "white",
    }}
  >
    Table View
  </button>

  <button
    onClick={() => setAnalysisView("graph")}
    style={{
      backgroundColor:
        analysisView === "graph"
          ? "#ff969dff"
          : "white",
    }}
  >
    Graph View
  </button>
</div>

{/* SWITCH BETWEEN TABLES AND GRAPHS */}
{/* Tables */}
{analysisView === "table" ? (
<>
{renderZoneTimeTable({
  title: "Minutes per zone"
})}

{renderZoneTimeTable({
  title: "Cumulative minutes per zone",
  cumulative: true
})}

{renderAZoneTable()}

{renderEventZoneTable({
  title: "Rucks per zone",
  eventCode: "R"
})}

{renderEventZoneTable({
  title: "Cumulative rucks per zone",
  eventCode: "R",
  cumulative: true
})}

{renderEventZoneTable({
  title: "Lineouts per zone",
  eventCode: "L"
})}

{renderEventZoneTable({
  title: "Scrums per zone",
  eventCode: "S"
})}

{renderEventZoneTable({
  title: "Kicks per zone",
  eventCode: "K"
})}
 </>

) : (
// Graphs
  <ZoneTimeGraphs
    getZoneTime={getZoneTime}
    intervals={intervals}
    zones={zones}
    awayName={gameInfo?.vs_team || "Away"}
    formatTime={formatTime}
  />
)}
        </div>
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
