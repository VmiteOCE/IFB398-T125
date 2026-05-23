
import { Container, Row, Col, Button } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import GameClock from "../components/GameClock";

function EventCapture() {
  const { id } = useParams();
  const gameId = parseInt(id, 10) || 1;

  const [selectedZone, setSelectedZone] = useState("M");
  const [selectedTeam, setSelectedTeam] = useState("Reds");
  const [manualFlip, setManualFlip] = useState(false);

  const [events, setEvents] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const [currentTime, setCurrentTime] = useState("00:00");

  // Convert mm:ss → seconds
  const toSeconds = (timeStr) => {
    const [mins, secs] = timeStr.split(":").map(Number);
    return mins * 60 + secs;
  };

  // Map action → API event_code
  const actionToCode = {
    Pass: "P",
    Kick: "K",
    Catch: "C",
    Ruck: "R",
    Scrum: "S",
    Penalty: "E",
    Advantage: "A",
    Turnover: "T",
    Lineout: "L",
    Conversion: "V",
    Try: "Y",
    Maul: "M",
  };

  const baseZones = [
    { label: "A", color: "red", text: "(0–22m)" },
    { label: "B", color: "pink", text: "(22–40m)" },
    { label: "M", color: "gray", text: "(Midfield)" },
    { label: "C", color: "lightblue", text: "(60–72m)" },
    { label: "D", color: "blue", text: "(72–94m)" },
  ];

  const isTeamReversed = selectedTeam === "Away";
  const finalReversed = isTeamReversed !== manualFlip;

  const zones = finalReversed ? [...baseZones].reverse() : baseZones;

  const currentZone = baseZones.find((z) => z.label === selectedZone);

  const actionKeys = {
    r: "Ruck",
    k: "Kick",
    p: "Pass",
    c: "Catch",
    t: "Turnover",
    a: "Advantage",
    e: "Penalty",
    l: "Lineout",
    s: "Scrum",
    m: "Maul",
    y: "Try",
    v: "Conversion",
  };

  // POST event to API
  const postEvent = async (action) => {
    const payload = {
      game_id: gameId,
      event_code: actionToCode[action],
      zone_id: selectedZone,
      team_id: selectedTeam === "Reds" ? 1 : 2,
      game_clock: toSeconds(currentTime),
      game_half: 1,
    };

    try {
      const res = await fetch("/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.message || "Failed to save");
      }

      return true;
    } catch (err) {
      console.error("POST error:", err);
      return false;
    }
  };

  // ADD / EDIT EVENT
  const handleAction = async (action) => {
    const success = await postEvent(action);

    if (!success) return;

    const newEvent = {
      action,
      zone: selectedZone,
      team: selectedTeam === "Reds" ? "R" : "A",
      time: currentTime,
    };

    if (editingIndex !== null) {
      const updated = [...events];
      updated[editingIndex] = newEvent;
      setEvents(updated);
      setEditingIndex(null);
    } else {
      setEvents([newEvent, ...events]);
    }
  };

  // DELETE (UI only)
  const deleteEvent = (index) => {
    const updated = events.filter((_, i) => i !== index);
    setEvents(updated);
  };

  const toggleEdit = (index) => {
    if (editingIndex === index) {
      setEditingIndex(null);
    } else {
      setEditingIndex(index);
      setSelectedZone(events[index].zone);
      setSelectedTeam(events[index].team === "R" ? "Reds" : "Away");
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentIndex = zones.findIndex((z) => z.label === selectedZone);

      if (e.key === "ArrowRight") {
        const nextIndex = currentIndex + 1;
        if (nextIndex < zones.length) {
          e.preventDefault();
          setSelectedZone(zones[nextIndex].label);
        }
      }

      if (e.key === "ArrowLeft") {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          e.preventDefault();
          setSelectedZone(zones[prevIndex].label);
        }
      }

      if (e.key === "Tab") {
        e.preventDefault();
        setSelectedTeam(selectedTeam === "Reds" ? "Away" : "Reds");
      }

      const action = actionKeys[e.key.toLowerCase()];
      if (action) {
        e.preventDefault();
        handleAction(action);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [selectedZone, zones, selectedTeam, currentTime, events, editingIndex]);

  return (
    <Container fluid style={{ backgroundColor: "#5a1f28", minHeight: "100vh", color: "white" }}>
      <div className="text-center p-3">
        <h3>Game ID: {gameId}</h3>
        <h4>Score: 12 - 7</h4>
      </div>

      <Row className="mt-3">
        {/* LEFT SIDE */}
        <Col md={4}>
          <div className="text-center bg-light text-dark p-2">
            <GameClock setCurrentTime={setCurrentTime} />
          </div>

          <div className="bg-light text-dark p-2" style={{ maxHeight: "500px", overflowY: "auto" }}>
            <h5>Event History</h5>

            {events.map((event, index) => (
              <div
                key={index}
                className="d-flex justify-content-between align-items-center p-2 mb-2"
                style={{
                  background: event.team === "R" ? "#b30000" : "#0033cc",
                  color: "white",
                  border: editingIndex === index ? "3px solid #4CAF50" : "2px solid transparent",
                }}
              >
                <div>
                  {event.action} ({event.zone}) - ({event.time}) - {event.team}
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => toggleEdit(index)}>✏️</button>
                  <button onClick={() => deleteEvent(index)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </Col>

        {/* RIGHT SIDE */}
        <Col md={8}>
          <div className="p-3 text-center bg-dark text-white">
            <p>
              Zone Selected: {currentZone.label} {currentZone.text}
            </p>

            <div style={{ display: "flex" }}>
              {zones.map((zone) => (
                <div
                  key={zone.label}
                  onClick={() => setSelectedZone(zone.label)}
                  style={{
                    flex: 1,
                    background: zone.color,
                    padding: 30,
                    cursor: "pointer",
                    border: selectedZone === zone.label ? "4px solid #4CAF50" : "2px solid transparent",
                  }}
                >
                  {zone.label}
                </div>
              ))}
            </div>

            {/* TEAM */}
            <div style={{ display: "flex", marginTop: 10 }}>
              <div
                onClick={() => setSelectedTeam("Reds")}
                style={{
                  flex: 1,
                  padding: 10,
                  cursor: "pointer",
                  background: selectedTeam === "Reds" ? "red" : "#eee",
                  color: selectedTeam === "Reds" ? "white" : "black",
                }}
              >
                Reds
              </div>

              <div onClick={() => setManualFlip(!manualFlip)} style={{ width: 60, cursor: "pointer" }}>
                🔄
              </div>

              <div
                onClick={() => setSelectedTeam("Away")}
                style={{
                  flex: 1,
                  padding: 10,
                  cursor: "pointer",
                  background: selectedTeam === "Away" ? "blue" : "#eee",
                  color: selectedTeam === "Away" ? "white" : "black",
                }}
              >
                Away
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="bg-light text-dark p-3 mt-3">
            <h5 className="text-center">Event Actions</h5>

            <Row>
              {Object.keys(actionToCode).map((action, i) => (
                <Col xs={6} md={3} key={i} className="mb-3">
                  <Button className="w-100" onClick={() => handleAction(action)}>
                    {action}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default EventCapture;
