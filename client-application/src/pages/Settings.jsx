import { Container, Row, Col, Button, Form } from "react-bootstrap";
import { useState } from "react";

function Settings() {
  const [activeSection, setActiveSection] = useState("Profile");
  const [saveMessage, setSaveMessage] = useState("");

  // ---------------- PROFILE ----------------
  const [profile, setProfile] = useState({
    profilePicture: "",
    email: "john@example.com",
    username: "john doe",
    role: "Owner",
  });

  // ---------------- ACCESSIBILITY ----------------
  const [accessibility, setAccessibility] = useState({
    fontSize: 100,
    highContrast: false,
    largeButtons: false,
    keybinds: true,
  });

  // ---------------- MATCH SETTINGS ----------------
  const [matchSettings, setMatchSettings] = useState({
    pageLayout: "Standard",
    defaultTeamSide: "Reds",
    eventHistorySize: 8,
  });

  // ---------------- SECURITY ----------------
  const [accessLevels, setAccessLevels] = useState({
    Analyst: "Edit matches",
    Coach: "View and edit",
    Viewer: "View only",
  });

  const settingsSections = [
    { label: "Profile", icon: "P" },
    { label: "Accessibility", icon: "A" },
    { label: "Match Settings", icon: "M" },
    { label: "Security", icon: "S" },
    { label: "Data & Export", icon: "D" },
    { label: "Help", icon: "?" },
  ];

  // ---------------- HELPERS ----------------
  const showSaved = (message = "Settings saved") => {
    setSaveMessage(message);
    window.clearTimeout(window.settingsSaveTimer);
    window.settingsSaveTimer = window.setTimeout(() => {
      setSaveMessage("");
    }, 2500);
  };

  const handleProfilePicture = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfile((previous) => ({
        ...previous,
        profilePicture: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const payload = {
      profile,
      accessibility,
      matchSettings,
      accessLevels,
    };

    try {
      // Connect this request to the settings route when the backend is ready.
      // const res = await fetch("/settings", {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });
      // if (!res.ok) throw new Error("Unable to save settings");

      console.log("Settings payload:", payload);
      showSaved();
    } catch (err) {
      console.error("Settings save error:", err);
    }
  };

  const exportCsv = () => {
    const rows = [
      ["setting", "value"],
      ["username", profile.username],
      ["email", profile.email],
      ["role", profile.role],
      ["font_size", accessibility.fontSize],
      ["high_contrast", accessibility.highContrast],
      ["large_buttons", accessibility.largeButtons],
      ["keybinds", accessibility.keybinds],
      ["page_layout", matchSettings.pageLayout],
      ["default_team_side", matchSettings.defaultTeamSide],
      ["event_history_size", matchSettings.eventHistorySize],
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reds-settings.csv";
    link.click();
    URL.revokeObjectURL(url);

    showSaved("CSV export downloaded");
  };

  const initials = profile.username
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const controlButtonStyle = accessibility.largeButtons
    ? { minHeight: 52, paddingLeft: 24, paddingRight: 24 }
    : {};

  // ---------------- PROFILE UI ----------------
  const renderProfile = () => (
    <div className="bg-light text-dark p-3 h-100">
      <div className="text-center mb-4">
        <h4>Profile</h4>
        <p className="text-muted mb-0">Manage your account details.</p>
      </div>

      <Row className="justify-content-center">
        <Col lg={4} className="text-center mb-4 mb-lg-0">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center"
            style={{
              width: 130,
              height: 130,
              borderRadius: "50%",
              overflow: "hidden",
              background: "#b30000",
              color: "white",
              border: "5px solid #5a1f28",
              fontSize: 34,
              fontWeight: "bold",
            }}
          >
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt="Profile preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials || "U"
            )}
          </div>

          <Form.Label
            htmlFor="profile-picture"
            className="btn btn-outline-danger mb-0"
            style={controlButtonStyle}
          >
            Change Picture
          </Form.Label>
          <Form.Control
            id="profile-picture"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleProfilePicture}
            className="d-none"
          />
        </Col>

        <Col lg={7}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              value={profile.username}
              onChange={(event) =>
                setProfile({ ...profile, username: event.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={profile.email}
              onChange={(event) =>
                setProfile({ ...profile, email: event.target.value })
              }
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Role / Access Level</Form.Label>
            <Form.Control value={profile.role} disabled />
          </Form.Group>
        </Col>
      </Row>
    </div>
  );

  // ---------------- ACCESSIBILITY UI ----------------
  const renderAccessibility = () => (
    <div className="bg-light text-dark p-3 h-100">
      <div className="text-center mb-4">
        <h4>Accessibility</h4>
        <p className="text-muted mb-0">Adjust text and controls across the app.</p>
      </div>

      <div className="p-3 border-bottom">
        <Row className="align-items-center">
          <Col md={7}>
            <strong>Font Size</strong>
            <div className="text-muted small">Change the size of text in the interface.</div>
          </Col>
          <Col md={5} className="mt-3 mt-md-0">
            <div className="d-flex align-items-center gap-3">
              <Form.Range
                min={90}
                max={125}
                step={5}
                value={accessibility.fontSize}
                onChange={(event) =>
                  setAccessibility({
                    ...accessibility,
                    fontSize: parseInt(event.target.value, 10),
                  })
                }
              />
              <strong style={{ minWidth: 48 }}>{accessibility.fontSize}%</strong>
            </div>
          </Col>
        </Row>
      </div>

      {[
        {
          key: "highContrast",
          title: "High Contrast Mode",
          description: "Increase the contrast between interface elements.",
        },
        {
          key: "largeButtons",
          title: "Large Buttons",
          description: "Increase button sizes for easier selection.",
        },
        {
          key: "keybinds",
          title: "Keybinds",
          description: "Enable keyboard shortcuts on the capture page.",
        },
      ].map((setting) => (
        <div className="p-3 border-bottom" key={setting.key}>
          <div className="d-flex justify-content-between align-items-center gap-3">
            <div>
              <strong>{setting.title}</strong>
              <div className="text-muted small">{setting.description}</div>
            </div>
            <Form.Check
              type="switch"
              id={setting.key}
              checked={accessibility[setting.key]}
              onChange={(event) =>
                setAccessibility({
                  ...accessibility,
                  [setting.key]: event.target.checked,
                })
              }
            />
          </div>
        </div>
      ))}
    </div>
  );

  // ---------------- MATCH SETTINGS UI ----------------
  const renderMatchSettings = () => (
    <div className="bg-light text-dark p-3 h-100">
      <div className="text-center mb-4">
        <h4>Match Settings</h4>
        <p className="text-muted mb-0">Set the defaults used by the capture page.</p>
      </div>

      <Form.Group className="mb-4">
        <Form.Label>Game Events / Analytics Page Layout</Form.Label>
        <Form.Select
          value={matchSettings.pageLayout}
          onChange={(event) =>
            setMatchSettings({ ...matchSettings, pageLayout: event.target.value })
          }
        >
          <option>Standard</option>
          <option>Compact</option>
          <option>Analytics Focus</option>
        </Form.Select>
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-4">
            <Form.Label>Default Team Side</Form.Label>
            <Form.Select
              value={matchSettings.defaultTeamSide}
              onChange={(event) =>
                setMatchSettings({
                  ...matchSettings,
                  defaultTeamSide: event.target.value,
                })
              }
            >
              <option>Reds</option>
              <option>Away</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-4">
            <Form.Label>Event History Size</Form.Label>
            <Form.Select
              value={matchSettings.eventHistorySize}
              onChange={(event) =>
                setMatchSettings({
                  ...matchSettings,
                  eventHistorySize: parseInt(event.target.value, 10),
                })
              }
            >
              <option value={5}>Last 5 Events</option>
              <option value={8}>Last 8 Events</option>
              <option value={12}>Last 12 Events</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <div className="bg-dark text-white p-3 mt-2">
        <div className="text-center mb-2">Capture Page Preview</div>
        <div className="d-flex" style={{ minHeight: 60 }}>
          {["A", "B", "M", "C", "D"].map((zone, index) => (
            <div
              key={zone}
              className="d-flex align-items-center justify-content-center"
              style={{
                flex: 1,
                color: index === 1 || index === 3 ? "#333" : "white",
                background: ["red", "pink", "gray", "lightblue", "blue"][index],
                border: zone === "M" ? "3px solid #4CAF50" : "2px solid transparent",
              }}
            >
              {zone}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ---------------- SECURITY UI ----------------
  const renderSecurity = () => (
    <div className="bg-light text-dark p-3 h-100">
      <div className="text-center mb-4">
        <h4>Security</h4>
        <p className="text-muted mb-0">Manage password and user access levels.</p>
      </div>

      <div className="d-flex justify-content-between align-items-center gap-3 p-3 border-bottom">
        <div>
          <strong>Change Password</strong>
          <div className="text-muted small">Update the password used to access the app.</div>
        </div>
        <Button variant="outline-danger" style={controlButtonStyle}>
          Change Password
        </Button>
      </div>

      {profile.role === "Owner" && (
        <div className="mt-4">
          <h5>Modify Access Levels</h5>
          <p className="text-muted small">This section is available to the Owner only.</p>

          {Object.keys(accessLevels).map((role) => (
            <Row className="align-items-center py-2 border-bottom" key={role}>
              <Col sm={5}>
                <strong>{role}</strong>
              </Col>
              <Col sm={7}>
                <Form.Select
                  value={accessLevels[role]}
                  onChange={(event) =>
                    setAccessLevels({
                      ...accessLevels,
                      [role]: event.target.value,
                    })
                  }
                >
                  <option>View only</option>
                  <option>Edit matches</option>
                  <option>View and edit</option>
                  <option>No access</option>
                </Form.Select>
              </Col>
            </Row>
          ))}
        </div>
      )}
    </div>
  );

  // ---------------- DATA UI ----------------
  const renderDataExport = () => (
    <div className="bg-light text-dark p-3 h-100">
      <div className="text-center mb-4">
        <h4>Data & Export</h4>
        <p className="text-muted mb-0">Download app data in CSV format.</p>
      </div>

      <div className="border p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center text-white fw-bold"
            style={{ width: 58, height: 58, background: "#b30000" }}
          >
            CSV
          </div>
          <div>
            <strong>Export Data as CSV</strong>
            <div className="text-muted small">Download the available match and event data.</div>
          </div>
        </div>
        <Button variant="danger" onClick={exportCsv} style={controlButtonStyle}>
          Export CSV
        </Button>
      </div>
    </div>
  );

  // ---------------- HELP UI ----------------
  const renderHelp = () => (
    <div className="bg-light text-dark p-3 h-100">
      <div className="text-center mb-4">
        <h4>Help</h4>
        <p className="text-muted mb-0">Guide on how to use the app.</p>
      </div>

      {[
        ["1", "Select a Game", "Open the dashboard and choose the game that you want to capture."],
        ["2", "Start the Clock", "Use the game clock controls before recording match events."],
        ["3", "Choose Zone and Team", "Select a field zone and choose Reds or Away."],
        ["4", "Record an Event", "Select an event action or use an enabled keyboard shortcut."],
        ["5", "Review Events", "Use event history to edit or delete a recorded event."],
        ["6", "Export Data", "Open Data & Export to download the available data as CSV."],
      ].map(([number, title, description]) => (
        <div className="d-flex gap-3 p-3 border-bottom" key={number}>
          <div
            className="d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
            style={{ width: 36, height: 36, background: "#b30000" }}
          >
            {number}
          </div>
          <div>
            <strong>{title}</strong>
            <div className="text-muted small">{description}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "Accessibility":
        return renderAccessibility();
      case "Match Settings":
        return renderMatchSettings();
      case "Security":
        return renderSecurity();
      case "Data & Export":
        return renderDataExport();
      case "Help":
        return renderHelp();
      default:
        return renderProfile();
    }
  };

  // ---------------- UI ----------------
  return (
    <Container
      fluid
      style={{
        backgroundColor: accessibility.highContrast ? "#000" : "#5a1f28",
        minHeight: "100vh",
        color: "white",
        fontSize: `${accessibility.fontSize}%`,
        paddingBottom: 40,
      }}
    >
      <div className="text-center p-3">
        <h3>Settings</h3>
        <h5>Manage your Reds app preferences</h5>
      </div>

      <Row className="mt-3 justify-content-center">
        <Col xl={3} lg={4} md={4} className="mb-3 mb-md-0">
          <div className="bg-dark text-white p-3 h-100">
            <h5 className="text-center mb-3">Settings Menu</h5>

            {settingsSections.map((section) => (
              <Button
                key={section.label}
                variant={activeSection === section.label ? "danger" : "dark"}
                className="w-100 mb-2 text-start d-flex align-items-center"
                style={{
                  minHeight: accessibility.largeButtons ? 60 : 50,
                  border:
                    activeSection === section.label
                      ? "3px solid #4CAF50"
                      : "2px solid #555",
                }}
                onClick={() => setActiveSection(section.label)}
              >
                <span
                  className="d-inline-flex align-items-center justify-content-center me-3"
                  style={{
                    width: 30,
                    height: 30,
                    border: "1px solid #aaa",
                    borderRadius: 4,
                    fontWeight: "bold",
                  }}
                >
                  {section.icon}
                </span>
                <span>{section.label}</span>
              </Button>
            ))}
          </div>
        </Col>

        <Col xl={7} lg={8} md={8}>
          <div style={{ minHeight: 560 }}>{renderActiveSection()}</div>

          {!["Data & Export", "Help"].includes(activeSection) && (
            <div className="bg-light text-dark p-3 mt-3 d-flex justify-content-end">
              <Button variant="danger" onClick={handleSave} style={controlButtonStyle}>
                Save Changes
              </Button>
            </div>
          )}
        </Col>
      </Row>

      {saveMessage && (
        <div
          className="position-fixed bottom-0 end-0 m-4 px-3 py-2 bg-dark text-white"
          role="status"
          style={{ borderLeft: "5px solid #4CAF50", zIndex: 1050 }}
        >
          {saveMessage}
        </div>
      )}
    </Container>
  );
}

export default Settings;
