
import { Container, Row, Col, Button } from "react-bootstrap";
import { useState, useEffect } from "react";

function EventCapture() {
  const [selectedZone, setSelectedZone] = useState("M");
  const [selectedTeam, setSelectedTeam] = useState("Reds");
  const [isReversed, setIsReversed] = useState(false);

  const [events, setEvents] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  // ✅ STATIC TIME (replace later with real timer)
  const currentTime = "26:45";

  const baseZones = [
    { label: "A", color: "red", text: "(0–22m)" },
    { label: "B", color: "pink", text: "(22–40m)" },
    { label: "M", color: "gray", text: "(Midfield)" },
    { label: "C", color: "lightblue", text: "(60–72m)" },
    { label: "D", color: "blue", text: "(72–94m)" },
  ];

  const zones = isReversed ? [...baseZones].reverse() : baseZones;
  const currentZone = baseZones.find((z) => z.label === selectedZone);

  // ✅ KEYBOARD CONTROL (no wrap)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentIndex = zones.findIndex(
        (z) => z.label === selectedZone
      );

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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [selectedZone, zones]);

  // ✅ ADD / EDIT EVENT
  const handleAction = (action) => {
    const newEvent = {
      action,
      zone: selectedZone,
      team: selectedTeam === "Reds" ? "R" : "A",
      time: currentTime, // ✅ static
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

  // ✅ DELETE
  const deleteEvent = (index) => {
    const updated = events.filter((_, i) => i !== index);
    setEvents(updated);
  };

  // ✅ EDIT MODE
  const toggleEdit = (index) => {
    if (editingIndex === index) {
      setEditingIndex(null);
    } else {
      setEditingIndex(index);
      setSelectedZone(events[index].zone);
      setSelectedTeam(events[index].team === "R" ? "Reds" : "Away");
    }
  };

  return (
    <Container
      fluid
      style={{
        backgroundColor: "#5a1f28",
        minHeight: "100vh",
        color: "white",
      }}
    >
      {/* HEADER */}
      <div className="text-center p-3">
        <h3>Queensland Reds vs Western Force</h3>
        <h4>Score: 12 - 7</h4>
      </div>

      {/* TIMER */}
      <div className="text-center bg-light text-dark p-2">
        <strong>{currentTime} (1st Half)</strong>
      </div>

      <Row className="mt-3">
        {/* ✅ EVENT HISTORY */}
        <Col md={4}>
          <div className="bg-light text-dark p-2">
            <h5>Event History</h5>

            {events.map((event, index) => (
              <div
                key={index}
                className="d-flex justify-content-between align-items-center p-2 mb-2"
                style={{
                  // ✅ RED OR BLUE BASED ON TEAM
                  background:
                    event.team === "R"
                      ? "#b30000"
                      : "#0033cc",
                  color: "white",
                  border:
                    editingIndex === index
                      ? "3px solid #4CAF50"
                      : "2px solid transparent",
                }}
              >
                {/* TEXT */}
                <div>
                  {event.action} ({event.time}) - {event.team}
                </div>

                {/* BUTTONS (RIGHT SIDE NOW) */}
                <div style={{ display: "flex", gap: 6 }}>
                  {/* EDIT */}
                  <button
                    onClick={() => toggleEdit(index)}
                    style={{
                      background:
                        editingIndex === index
                          ? "#4CAF50"
                          : "#555",
                      border: "none",
                      color: "white",
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    ✏️
                  </button>

                  {/* DELETE */}
                  <button
                    onClick={() => deleteEvent(index)}
                    style={{
                      background: "black",
                      border: "none",
                      color: "white",
                      padding: "4px 8px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Col>

        {/* ✅ ZONES + ACTIONS */}
        <Col md={8}>
          <div className="p-3 text-center bg-dark text-white">
            <p>
              Zone Selected: {currentZone.label}{" "}
              {currentZone.text}
            </p>

            {/* ZONES */}
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
                    border:
                      selectedZone === zone.label
                        ? "4px solid #4CAF50"
                        : "2px solid transparent",
                  }}
                >
                  {zone.label}
                </div>
              ))}
            </div>

            {/* TEAM SELECTOR */}
            <div
              style={{
                display: "flex",
                marginTop: 10,
                background: "#ddd",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => setSelectedTeam("Reds")}
                style={{
                  flex: 1,
                  padding: 10,
                  cursor: "pointer",
                  background:
                    selectedTeam === "Reds" ? "red" : "#eee",
                  color:
                    selectedTeam === "Reds"
                      ? "white"
                      : "black",
                  border:
                    selectedTeam === "Reds"
                      ? "3px solid #4CAF50"
                      : "2px solid transparent",
                }}
              >
                Reds
              </div>

              <div
                onClick={() => setIsReversed(!isReversed)}
                style={{
                  width: 60,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "#ccc",
                  cursor: "pointer",
                }}
              >
                🔄
              </div>

              <div
                onClick={() => setSelectedTeam("Away")}
                style={{
                  flex: 1,
                  padding: 10,
                  cursor: "pointer",
                  background:
                    selectedTeam === "Away" ? "blue" : "#eee",
                  color:
                    selectedTeam === "Away"
                      ? "white"
                      : "black",
                  border:
                    selectedTeam === "Away"
                      ? "3px solid #4CAF50"
                      : "2px solid transparent",
                }}
              >
                Away
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="bg-light text-dark p-3 mt-3">
            <h5 className="text-center">Event Actions</h5>

            <Row>
              {[
                "Pass", "Kick", "Catch", "Ruck",
                "Scrum", "Penalty", "Advantage", "Turnover",
                "Lineout", "Conversion", "Try", "Maul",
              ].map((action, i) => (
                <Col xs={6} md={3} key={i} className="mb-3">
                  <Button
                    className="w-100"
                    onClick={() => handleAction(action)}
                  >
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
