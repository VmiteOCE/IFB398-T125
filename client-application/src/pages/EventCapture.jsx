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
  const [gameInfo, setGameInfo] = useState(null);



  // ---------------- GAME INFO ----------------
  useEffect(() => {
    const fetchGameInfo = async () => {
      try {
        const res = await fetch(`/games/${gameId}`);
        const result = await res.json();



        if (!res.ok || result.error) throw new Error(result.message);
        setGameInfo(result.game);
      } catch (err) {
        console.error("Game fetch error:", err);
      }
    };



    fetchGameInfo();
  }, [gameId]);



  // ---------------- HELPERS ----------------
  const toSeconds = (timeStr) => {
    const [mins, secs] = timeStr.split(":").map(Number);
    return mins * 60 + secs;
  };



  const formatSeconds = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };



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
    Maul: "M",
  };



  const codeToAction = Object.fromEntries(
    Object.entries(actionToCode).map(([k, v]) => [v, k])
  );



  const baseZones = [
    { label: "A", text: "(0–22m)" },
    { label: "B", text: "(22–40m)" },
    { label: "M", text: "(Midfield)" },
    { label: "C", text: "(60–72m)" },
    { label: "D", text: "(72–94m)" },
  ];

  const oppositeZones = {
    A: "D",
    B: "C",
    M: "M",
    C: "B",
    D: "A",
  };

  const swapSelectedZone = () => {
    setSelectedZone((previousZone) => {
      return oppositeZones[previousZone] || previousZone;
    });
  };

  const handleTeamChange = (newTeam) => {
    // Do not swap if the selected team is clicked again.
    if (newTeam === selectedTeam) return;

    setSelectedTeam(newTeam);
    swapSelectedZone();
  };

  const handleManualFlip = () => {
    setManualFlip((previousFlip) => !previousFlip);
    swapSelectedZone();
  };

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
  };



  // ---------------- FETCH EVENTS ----------------
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`/events/game/${gameId}`);
        const result = await res.json();



        if (!res.ok || result.error) throw new Error(result.message);



        const mapped = result.events
          .slice()
          .reverse()
          .map((e) => ({
            id: e.event_id,
            action: codeToAction[e.event_code] || e.event_code,
            zone: e.zone_id,
            team: e.team_id === 1 ? "R" : "A",
            time: formatSeconds(e.game_clock),
          }));



        setEvents(mapped);
      } catch (err) {
        console.error("Fetch events error:", err);
      }
    };



    fetchEvents();
  }, [gameId]);



  // ---------------- CREATE ----------------
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });



      const result = await res.json();



      if (!res.ok || result.error) {
        throw new Error(result.message);
      }



      return result.event_id;
    } catch (err) {
      console.error("POST error:", err);
      return null;
    }
  };



  // ---------------- CREATE + UPDATE ----------------
  const handleAction = async (action) => {
    if (editingIndex !== null) {
      const event = events[editingIndex];



      const payload = {
        game_id: gameId,
        event_code: actionToCode[action],
        zone_id: selectedZone,
        team_id: selectedTeam === "Reds" ? 1 : 2,
        game_clock: toSeconds(currentTime),
        game_half: 1,
      };



      try {
        const res = await fetch(`/events/${event.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });



        const result = await res.json();



        if (!res.ok || result.error) throw new Error(result.message);



        const updated = [...events];
        updated[editingIndex] = {
          ...event,
          action,
          zone: selectedZone,
          team: selectedTeam === "Reds" ? "R" : "A",
          time: currentTime,
        };



        setEvents(updated);
        setEditingIndex(null);
      } catch (err) {
        console.error("Update error:", err);
      }
    } else {
      const eventId = await postEvent(action);
      if (!eventId) return;



      const newEvent = {
        id: eventId,
        action,
        zone: selectedZone,
        team: selectedTeam === "Reds" ? "R" : "A",
        time: currentTime,
      };



      setEvents((prev) => [newEvent, ...prev]);
    }
  };



  // ---------------- DELETE ----------------
  const deleteEvent = async (index) => {
    const event = events[index];



    try {
      const res = await fetch(`/events/${event.id}`, {
        method: "DELETE",
      });



      const result = await res.json();



      if (!res.ok || result.error) throw new Error(result.message);



      if (editingIndex === index) setEditingIndex(null);



      setEvents(events.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };



  // ---------------- EDIT ----------------
  const toggleEdit = (index) => {
    if (editingIndex === index) {
      setEditingIndex(null);
    } else {
      setEditingIndex(index);
      setSelectedZone(events[index].zone);
      setSelectedTeam(events[index].team === "R" ? "Reds" : "Away");
      setCurrentTime(events[index].time);
    }
  };



  // ---------------- KEYBOARD ----------------
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
        const newTeam =
          selectedTeam === "Reds" ? "Away" : "Reds";

        handleTeamChange(newTeam);
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
  }, [selectedZone, zones, selectedTeam, currentTime, editingIndex, events]);



  // ---------------- UI ----------------
  return (
    <Container fluid style={{ backgroundColor: "#5a1f28", minHeight: "100vh", color: "white" }}>
      <div className="text-center p-3">
        <h3>
          {gameInfo ? `Reds vs ${gameInfo.vs_team}` : `Game ID: ${gameId}`}
        </h3>
        <h4>
          {gameInfo ? gameInfo.game_name : "Score: 12 - 7"}
        </h4>
      </div>



      <Row className="mt-3">
        <Col md={4}>
          <div className="text-center bg-light text-dark p-2">
            <GameClock setCurrentTime={setCurrentTime} />
          </div>



          <div className="bg-light text-dark p-2" style={{ maxHeight: "500px", overflowY: "auto" }}>
            <h5>Event History (Last 8)</h5>



            {events.slice(0, 8).map((event, index) => (
              <div
                key={event.id}
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



        <Col md={8}>
          <div className="p-3 text-center bg-dark text-white">
            <p>
              Zone Selected: {currentZone.label} {currentZone.text}
            </p>
            


            <div style={{ display: "flex", transition: "all 0.3s ease" }}>
              {zones.map((zone) => (
                <div
                  key={zone.label}
                  onClick={() => setSelectedZone(zone.label)}
                  style={{
                    flex: 1,
                    background: selectedZone === zone.label
                    ? selectedTeam === "Reds"
                    ? "red"
                    : "blue"
                    : "white",
                    color: selectedZone === zone.label
                    ? "white"
                    : "black",
                    padding: 30,
                    cursor: "pointer",
                    border:
                      selectedZone === zone.label
                        ? "4px solid #4CAF50"
                        : "2px solid black",
                  }}
                >
                  {zone.label}
                </div>
              ))}
            </div>

            <div style={{
              fontSize: "30px",
              fontWeight: "bold",
              marginBottom: "10px",
              color: "#4CAF50"
              }}
              >
                {finalReversed ? "◀━━━━━━" : "━━━━━━▶"}
              </div>

            {/* TEAM SELECT FIXED */}
            <div
              style={{
                display: "flex",
                marginTop: 10,
                borderRadius: "8px",
                overflow: "hidden",
                background: "#ddd",
                height: 60,
              }}
            >
              <div
                onClick={() => handleTeamChange("Reds")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: selectedTeam === "Reds" ? "red" : "#eee",
                  color: selectedTeam === "Reds" ? "white" : "black",
                }}
              >
                Reds
              </div>



              <div
                onClick={handleManualFlip}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleManualFlip();
                  }
                }}
                style={{
                  width: 70,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "#bbb",
                  cursor: "pointer",
                  transform: manualFlip ? "rotate(180deg)" : "rotate(0deg)",
                  fontSize: "20px"
                }}
              >
                🔄
              </div>



              <div
                onClick={() => handleTeamChange("Away")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: selectedTeam === "Away" ? "blue" : "#eee",
                  color: selectedTeam === "Away" ? "white" : "black",
                }}
              >
                Away
              </div>
            </div>
          </div>



          <div className="bg-light text-dark p-3 mt-3">
            <h5 className="text-center">Event Actions</h5>
            <Row className="justify-content-center">
              {Object.keys(actionToCode).map((action, i) => (
                <Col xs={6} md={3} key={i} className="mb-3">
                  <Button className="w-100" onClick={() => handleAction(action)}
                  style={{whiteSpace: "nowrap", fontSize: "clamp(12px, 1.2vw, 16px)", padding: "10px 4px",}}>
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