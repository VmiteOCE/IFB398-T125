import { Container, Row, Col, Button } from "react-bootstrap";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GameClock from "../components/GameClock";
import "../styles/EventCapture.css";

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

const outlineColours = {
  Green: "#4caf50",
  Red: "#ff0000",
  Blue: "#0000ff",
  Yellow: "#ffff00",
  White: "#ffffff",
};

const codeToAction = Object.fromEntries(
  Object.entries(actionToCode).map(([k, v]) => [v, k])
);

function EventCapture() {
  const { id } = useParams();
  const gameId = parseInt(id, 10) || 1;
  const navigate = useNavigate();
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

  // ---------------- KEYBINDS ----------------
  // Initial default keybinds, gets overwritten by fetch if user has saved keybinds
  const [keybinds, setKeybinds] = useState({
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
    Pause: " ",
    Add_Time: "=",
    Remove_Time: "-",
    Move_Zone_Left: "ArrowLeft",
    Move_Zone_Right: "ArrowRight",
    Swap_Team: "Tab",
    Swap_Direction: "ArrowUp",
  });

  useEffect(() => {
    const fetchKeybinds = async () => {
      try {
        const res = await fetch("/user/keybinds", {
          credentials: "include",
        });
        const result = await res.json();

        if (!res.ok || result.error) {
          throw new Error(result.message);
        }

        setKeybinds((prev) => ({
          ...prev,
          ...(result.keybinds || {}),
        }));
      } catch (err) {
        console.error("Keybind fetch error:", err);
      }
    };

    fetchKeybinds();
  }, []);
  
  
  // Mapping keybinds to actions to match old system
  const actionKeys = Object.fromEntries(
    Object.entries(keybinds || {})
      .filter(([action, key]) => actionToCode[action] && key)
      .map(([action, key]) => [String(key).toLowerCase(), action])
  );

  //----------------- SETTINGS ----------------
  const [settings, setSettings] = useState({
    Default_Home_Team: true,
    Event_History_Length: 8,
    Enable_Keybinds: true,
    Large_Buttons: false,
    Dark_Mode: false,
    Outline_Colour: "Green",
  });

  const selectedOutlineColour =
  outlineColours[settings.Outline_Colour] || outlineColours.Green;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/user/settings");
        const result = await res.json();

        if (!res.ok || result.error) {
          throw new Error(result.message);
        }

        if (result.settings) {
          setSettings(result.settings);

          setSelectedTeam(
            result.settings.Default_Home_Team ? "Reds" : "Away"
          );
        }
      } catch (err) {
        console.error("Settings fetch error:", err);
      }
    };

    fetchSettings();
  }, []);

  

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
  const handleActionRef = useRef(handleAction);
  const handleTeamChangeRef = useRef(handleTeamChange);

  useEffect(() => {
    handleActionRef.current = handleAction;
  });

  useEffect(() => {
    handleTeamChangeRef.current = handleTeamChange;
  });

  useEffect(() => {
    if (!settings.Enable_Keybinds) return; // Skip if keybinds are disabled
    const handleKeyDown = (e) => {
      const currentIndex = zones.findIndex((z) => z.label === selectedZone);

      if (e.key === keybinds.Move_Zone_Right) {
        const nextIndex = currentIndex + 1;

        if (nextIndex < zones.length) {
          e.preventDefault();
          setSelectedZone(zones[nextIndex].label);
        }
      }

      if (e.key === keybinds.Move_Zone_Left) {
        const prevIndex = currentIndex - 1;

        if (prevIndex >= 0) {
          e.preventDefault();
          setSelectedZone(zones[prevIndex].label);
        }
      }

      if (e.key === keybinds.Swap_Team) {
        e.preventDefault();

        const newTeam = selectedTeam === "Reds" ? "Away" : "Reds";

        handleTeamChangeRef.current(newTeam);
      }

      const action = actionKeys[e.key.toLowerCase()];

      if (action) {
        e.preventDefault();
        handleActionRef.current(action);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedZone, zones, selectedTeam, currentTime, editingIndex, events]);

  // ---------------- UI ----------------
  return (
    <Container fluid className="event-capture-page">
      <div className="dashboard-content event-capture-content">
        <div className="event-capture-header">
          <button
            className="event-capture-back-button"
            onClick={() => navigate("/dashboard")}
            aria-label="Go Back"
          >
            ←
          </button>

          <h3>
            {gameInfo ? `Reds vs ${gameInfo.vs_team}` : `Game ID: ${gameId}`}
          </h3>
        </div>

        <Row className="event-capture-row">
          <Col md={4}>
            <div className="game-clock-panel">
              <GameClock setCurrentTime={setCurrentTime} keybinds={keybinds} />
            </div>

            <div className="event-history-panel">
              <h5>Event History (Last {settings.Event_History_Length})</h5>

              {events.slice(0, settings.Event_History_Length).map((event, index) => (
                <div
                  key={event.id}
                  className={`event-history-item ${
                    event.team === "R"
                      ? "event-history-item-red"
                      : "event-history-item-blue"
                  } ${
                    editingIndex === index ? "event-history-item-editing" : ""
                  }`}
                >
                  <div>
                    {event.action} ({event.zone}) - ({event.time}) - {event.team}
                  </div>

                  <div className="event-history-actions">
                    <button onClick={() => toggleEdit(index)}>✏️</button>
                    <button onClick={() => deleteEvent(index)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </Col>

          <Col md={8}>
            <div className="field-panel">
              <p>
                Zone Selected: {currentZone.label} {currentZone.text}
              </p>

              <div className="zone-row">
                {zones.map((zone) => {
                  const isSelected = selectedZone === zone.label;

                  return (
                    <div
                      key={zone.label}
                      onClick={() => setSelectedZone(zone.label)}
                      className={`zone-box ${
                        isSelected ? "zone-box-selected" : ""
                      } ${
                        isSelected && selectedTeam === "Reds"
                          ? "zone-box-red"
                          : ""
                      } ${
                        isSelected && selectedTeam === "Away"
                          ? "zone-box-blue"
                          : ""
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: settings.Outline_Colour,
                            }
                          : {}
                      }
                    >
                      {zone.label}
                    </div>
                  );
                })}
              </div>

            <div style={{
              fontSize: "30px",
              fontWeight: "bold",
              marginBottom: "10px",
              color: "#ffffffff"
              }}
              >
                {finalReversed ? "━━━━━━▶" : "◀━━━━━━"}
              </div>

              {/* TEAM SELECT FIXED */}
              <div className="team-selector">
                <div
                  onClick={() => handleTeamChange("Reds")}
                  className={`team-option ${
                    selectedTeam === "Reds" ? "team-option-red-selected" : ""
                  }`}
                >
                  Reds
                </div>

                <div
                  onClick={handleManualFlip}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === keybinds.Swap_Direction) {
                      event.preventDefault();
                      handleManualFlip();
                    }
                  }}
                  className={`team-flip ${
                    manualFlip ? "team-flip-active" : ""
                  }`}
                >
                  🔄
                </div>

                <div
                  onClick={() => handleTeamChange("Away")}
                  className={`team-option ${
                    selectedTeam === "Away" ? "team-option-blue-selected" : ""
                  }`}
                >
                  Away
                </div>
              </div>
            </div>

            <div className="event-actions-panel">
              <h5 className="event-actions-title">Event Actions</h5>

              <Row className="event-actions-row">
                {Object.keys(actionToCode).map((action, i) => (
                  <Col xs={6} md={3} key={i} className="event-action-col">
                    <Button
                      className="event-action-button"
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
      </div>
    </Container>
  );
}

export default EventCapture;