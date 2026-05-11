
import { Container, Row, Col, Button } from "react-bootstrap";
import { useState } from "react";

function EventCapture() {
  const [selectedZone, setSelectedZone] = useState("B");

  const zones = [
    { label: "A", color: "red", text: "(0–22m)" },
    { label: "B", color: "pink", text: "(22–40m)" },
    { label: "M", color: "gray", text: "(Midfield)" },
    { label: "C", color: "lightblue", text: "(60–72m)" },
    { label: "D", color: "blue", text: "(72–94m)" },
  ];

  const currentZone = zones.find((z) => z.label === selectedZone);

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
      <div className="p-3 text-center">
        <h3>Queensland Reds vs Western Force</h3>
        <h4>Score: 12 - 7</h4>
      </div>

      {/* TIMER */}
      <div className="text-center bg-light text-dark p-2">
        <strong>26:45 (1st Half)</strong>
      </div>

      <Row className="mt-3">
        {/* LEFT: EVENT HISTORY */}
        <Col md={4}>
          <div className="bg-light text-dark p-2">
            <h5>Event History</h5>

            <div className="p-2 border mb-2">
              Turnover (26:43)
            </div>
            <div className="p-2 border mb-2">
              Pass (26:38)
            </div>
            <div className="p-2 border mb-2">
              Pass (26:35)
            </div>
            <div className="p-2 border mb-2">
              Catch (26:30)
            </div>
          </div>
        </Col>

        {/* RIGHT: ACTION + ZONES */}
        <Col md={8}>
          {/* ✅ ZONE SELECTOR */}
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
                    border:
                      selectedZone === zone.label
                        ? "4px solid limegreen"
                        : "2px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  {zone.label}
                </div>
              ))}
            </div>
          </div>

          {/* BUTTON GRID */}
          <div className="bg-light text-dark p-3 mt-3">
            <h5 className="text-center">Event Actions</h5>

            <Row>
              {[
                "Pass", "Kick", "Catch", "Ruck",
                "Scrum", "Penalty", "Advantage", "Turnover",
                "Lineout", "Conversion", "Try", "Maul",
              ].map((action, i) => (
                <Col xs={6} md={3} key={i} className="mb-3">
                  <Button variant="secondary" className="w-100">
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
