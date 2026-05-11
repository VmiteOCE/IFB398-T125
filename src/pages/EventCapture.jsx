
import { Container, Row, Col, Button } from "react-bootstrap";
import { useState, useEffect } from "react";

function EventCapture() {
  const [selectedZone, setSelectedZone] = useState("M");
  const [selectedTeam, setSelectedTeam] = useState("Reds");
  const [isReversed, setIsReversed] = useState(false);

  const baseZones = [
    { label: "A", color: "red", text: "(0–22m)" },
    { label: "B", color: "pink", text: "(22–40m)" },
    { label: "M", color: "gray", text: "(Midfield)" },
    { label: "C", color: "lightblue", text: "(60–72m)" },
    { label: "D", color: "blue", text: "(72–94m)" },
  ];

  const zones = isReversed ? [...baseZones].reverse() : baseZones;

  const currentZone = baseZones.find((z) => z.label === selectedZone);

  // KEYBOARD CONTROL
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      const currentIndex = zones.findIndex(
        (z) => z.label === selectedZone
      );

      if (e.key === "ArrowRight") {
        const nextIndex = currentIndex + 1;

        // STOP at the end (no wrap)
        if (nextIndex < zones.length) {
          e.preventDefault();
          setSelectedZone(zones[nextIndex].label);
        }
      }

      if (e.key === "ArrowLeft") {
        const prevIndex = currentIndex - 1;

        // STOP at the beginning (no wrap)
        if (prevIndex >= 0) {
          e.preventDefault();
          setSelectedZone(zones[prevIndex].label);
        }
      }
    };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [selectedZone, zones]);


  return (
    <Container
      fluid
      className="event-capture"
      style={{
        backgroundColor: "#5a1f28",
        minHeight: "100vh",
        color: "white",
      }}
    >
      {/* HEADER */}
      <div className="header text-center p-3">
        <h3 className="match-title">
          Queensland Reds vs Western Force
        </h3>
        <h4 className="score">Score: 12 - 7</h4>
      </div>

      {/* TIMER */}
      <div className="timer text-center bg-light text-dark p-2">
        <strong>26:45 (1st Half)</strong>
      </div>

      <Row className="main-content mt-3">
        {/* LEFT: EVENT HISTORY */}
        <Col md={4}>
          <div className="event-history bg-light text-dark p-2">
            <h5>Event History</h5>

            <div className="event-item p-2 border mb-2">
              Turnover (26:43)
            </div>
            <div className="event-item p-2 border mb-2">
              Pass (26:38)
            </div>
            <div className="event-item p-2 border mb-2">
              Pass (26:35)
            </div>
            <div className="event-item p-2 border mb-2">
              Catch (26:30)
            </div>
          </div>
        </Col>

        {/* RIGHT: ACTION + ZONES */}
        <Col md={8}>
          {/* ZONE SELECTOR */}
          <div className="zone-selector p-3 text-center bg-dark text-white">
            
            <p className="zone-info">
              Zone Selected: {currentZone.label} {currentZone.text}
            </p>

            {/* ZONES */}
            <div className="zone-bar" style={{ display: "flex" }}>
              {zones.map((zone) => (
                <div
                  key={zone.label}
                  className="zone"
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
                    transition: "all 0.2s ease",
                  }}
                >
                  {zone.label}
                </div>
              ))}
            </div>

            {/* TEAM SELECTOR */}
            <div
              className="team-selector"
              style={{
                display: "flex",
                marginTop: 10,
                background: "#ddd",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {/* REDS */}
              <div
                className="team-option"
                onClick={() => setSelectedTeam("Reds")}
                style={{
                  flex: 1,
                  padding: 10,
                  cursor: "pointer",
                  background:
                    selectedTeam === "Reds" ? "red" : "#eee",
                  color:
                    selectedTeam === "Reds" ? "white" : "black",
                  fontWeight: "bold",
                  border:
                    selectedTeam === "Reds"
                      ? "3px solid #4CAF50"
                      : "2px solid transparent",
                  transition: "all 0.2s ease",
                }}
              >
                Reds
              </div>

              {/* SWAP */}
              <div
                className="swap-button"
                onClick={() => setIsReversed(!isReversed)}
                style={{
                  width: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ccc",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                🔄
              </div>

              {/* AWAY */}
              <div
                className="team-option"
                onClick={() => setSelectedTeam("Away")}
                style={{
                  flex: 1,
                  padding: 10,
                  cursor: "pointer",
                  background:
                    selectedTeam === "Away" ? "blue" : "#eee",
                  color:
                    selectedTeam === "Away" ? "white" : "black",
                  fontWeight: "bold",
                  border:
                    selectedTeam === "Away"
                      ? "3px solid #4CAF50"
                      : "2px solid transparent",
                  transition: "all 0.2s ease",
                }}
              >
                Away
              </div>
            </div>
          </div>

          {/* BUTTON GRID */}
          <div className="event-actions bg-light text-dark p-3 mt-3">
            <h5 className="text-center">Event Actions</h5>

            <Row>
              {[
                "Pass", "Kick", "Catch", "Ruck",
                "Scrum", "Penalty", "Advantage", "Turnover",
                "Lineout", "Conversion", "Try", "Maul",
              ].map((action, i) => (
                <Col xs={6} md={3} key={i} className="mb-3">
                  <Button className="action-button w-100">
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

