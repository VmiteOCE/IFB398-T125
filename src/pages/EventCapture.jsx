
import { Container, Row, Col, Button } from "react-bootstrap";

function EventCapture() {
  return (
    <Container fluid style={{ backgroundColor: "#5a1f28", minHeight: "100vh", color: "white" }}>
      
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

            <div className="p-2 border mb-2">Turnover (26:43)</div>
            <div className="p-2 border mb-2">Pass (26:38)</div>
            <div className="p-2 border mb-2">Pass (26:35)</div>
            <div className="p-2 border mb-2">Catch (26:30)</div>
          </div>
        </Col>

        {/* RIGHT: ACTION + ZONES */}
        <Col md={8}>
          
          {/* ZONE SELECTOR */}
          <div className="p-3 text-center bg-dark">
            <p>Zone Selected: B (22–40m)</p>
            <div style={{ display: "flex" }}>
              <div style={{ flex: 1, background: "red", padding: 30 }}>A</div>
              <div style={{ flex: 1, background: "green", padding: 30 }}>B</div>
              <div style={{ flex: 1, background: "gray", padding: 30 }}>M</div>
              <div style={{ flex: 1, background: "blue", padding: 30 }}>C</div>
              <div style={{ flex: 1, background: "purple", padding: 30 }}>D</div>
            </div>
          </div>

          {/* BUTTON GRID */}
          <div className="bg-light text-dark p-3 mt-3">
            <h5 className="text-center">Event Actions</h5>

            <Row>
              {[
                "Pass", "Kick", "Catch", "Ruck",
                "Scrum", "Penalty", "Advantage", "Turnover",
                "Lineout", "Conversion", "Try", "Maul"
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
