import { Container, Row, Col, Button, Form, Modal } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Settings.css";

function Settings() {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("Profile");
  const [saveMessage, setSaveMessage] = useState("");

  

  // ---------------- PROFILE ----------------
  const [profile, setProfile] = useState({
    profilePicture: "",
    email: "Loading...",
    username: "Loading...",
    role: "Loading...",
  });

  

  // ---------------- ACCESSIBILITY ----------------
  const [accessibility, setAccessibility] = useState({
    darkMode: false,
    largeButtons: false,
    enableKeybinds: true,
  });


  const [showKeybindModal, setShowKeybindModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });


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
        const res = await fetch("/user/keybinds");

        const result = await res.json();

        if (!res.ok || result.error) {
          throw new Error(result.message);
        }

        if (result.keybinds) {
          setKeybinds(result.keybinds);
        }

      } catch (err) {
        console.error("Keybind fetch error:", err);
      }
    };

    fetchKeybinds();
  }, []);


  // ---------------- MATCH SETTINGS ----------------
  const [matchSettings, setMatchSettings] = useState({
    defaultHomeSide: true,
    eventHistorySize: 8,
    outlineColour: "Green",
  });

  // ---------------- SECURITY ----------------
  const updatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showSaved("Please enter both passwords");
      return;
    }

    try {
      const res = await fetch("/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.message || "Unable to update password");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
      });

      setShowPasswordModal(false);

      showSaved("Password updated successfully");
    } catch (err) {
      console.error("Password update error:", err);
      showSaved(err.message || "Unable to update password");
    }
  };

  
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

  const saveKeybinds = async () => {
    try {
      const res = await fetch("/user/keybinds", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(keybinds),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.message);
      }

      showSaved("Keybinds saved");
      setShowKeybindModal(false);

    } catch (err) {
      console.error("Keybind save error:", err);
    }
  };

  const handleSave = async () => {
    const payload = {
      Event_History_Length: matchSettings.eventHistorySize,
      Outline_Colour: matchSettings.outlineColour,
      Enable_Keybinds: accessibility.enableKeybinds,
      Large_Buttons: accessibility.largeButtons,
      Dark_Mode: accessibility.darkMode,
      Default_Home_Team: matchSettings.defaultHomeSide,
    };


    try {
      const res = await fetch("/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error("Unable to save settings");
      }

      console.log("Settings payload:", payload);
      showSaved();
    } catch (err) {
      console.error("Settings save error:", err);
    }
  };

  const restoreDefaultSettings = async () => {
    try {
      const res = await fetch("/user/settings", {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.message || "Unable to reset settings");
      }

      // Reset the settings displayed in the UI
      setAccessibility({
        darkMode: false,
        largeButtons: false,
        enableKeybinds: true,
      });

      setMatchSettings({
        defaultHomeSide: true,
        eventHistorySize: 8,
        outlineColour: "Green",
      });

      showSaved("Settings restored to defaults");
    } catch (err) {
      console.error("Settings reset error:", err);
    }
  };


  


  const controlButtonStyle = accessibility.largeButtons
    ? { minHeight: 52, paddingLeft: 24, paddingRight: 24 }
    : {};

  // Fetch all settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/user/settings");

        const result = await res.json();

        if (!res.ok || result.error) {
          throw new Error(result.message);
        }

        if (result.settings) {
          setMatchSettings({
            defaultHomeSide: result.settings.Default_Home_Team,
            eventHistorySize: result.settings.Event_History_Length,
            outlineColour: result.settings.Outline_Colour || "Green",
          });

          setAccessibility({
            darkMode: result.settings.Dark_Mode ?? false,
            largeButtons: result.settings.Large_Buttons ?? false,
            enableKeybinds: result.settings.Enable_Keybinds ?? true,
          });
        }

      } catch (err) {
        console.error("Settings fetch error:", err);
      }
    };
    
    fetchSettings();
  }, []);

  // ---------------- PROFILE UI ----------------
  const renderProfile = () => (
    <div className="settings-section-panel">
      <div className="text-center mb-4">
        <h4>Profile</h4>
        <p className="text-muted mb-0">Manage your account details.</p>
      </div>

      <Row className="justify-content-center">
        <Col lg={4} className="text-center mb-4 mb-lg-0">
          <div className="settings-profile-avatar mx-auto mb-3 d-flex align-items-center justify-content-center">
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt="Profile preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              "Profile"
            )}
          </div>

          <Form.Label
            htmlFor="profile-picture"
            className="btn settings-outline-button mb-0"
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
    <div className="settings-section-panel">
      <div className="text-center mb-4">
        <h4>Accessibility</h4>
        <p className="text-muted mb-0">
          Adjust the appearance and controls across the app.
        </p>
      </div>

      {[
        {
          key: "darkMode",
          title: "Dark Mode",
          description:
            "Use a darker colour scheme throughout the app.",
        },
        {
          key: "largeButtons",
          title: "Large Buttons",
          description:
            "Increase button sizes for easier selection.",
        },
        {
          key: "enableKeybinds",
          title: "Enable Keybinds",
          description:
            "Allow keyboard shortcuts to be used throughout the app.",
        },
      ].map((setting) => (
        <div className="p-3 border-bottom" key={setting.key}>
          <div className="d-flex justify-content-between align-items-center gap-3">
            <div>
              <strong>{setting.title}</strong>
              <div className="text-muted small">
                {setting.description}
              </div>
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

      <div className="p-3">
        <div className="d-flex justify-content-between align-items-center gap-3">
          <div>
            <strong>Keybind Configuration</strong>
            <div className="text-muted small">
              Configure the keyboard shortcuts used throughout the app.
            </div>
          </div>

          <Button
            className="settings-outline-button"
            style={controlButtonStyle}
            onClick={() => setShowKeybindModal(true)}
          >
            Edit Keybinds
          </Button>
        </div>
      </div>
    </div>
  );


  // ---------------- MATCH SETTINGS UI ----------------
  const renderMatchSettings = () => (
    <div className="settings-section-panel">
      <div className="text-center mb-4">
        <h4>Match Settings</h4>
        <p className="text-muted mb-0">Set the defaults used by the capture page.</p>
      </div>


      <Row>
        <Col md={6}>
          <Form.Group className="mb-4">
            <Form.Label>Default Home Team</Form.Label>
            <Form.Select
              value={matchSettings.defaultHomeSide}
              onChange={(event) =>
                setMatchSettings({
                  ...matchSettings,
                  defaultHomeSide: event.target.value === "true",
                })
              }
            >
              <option value={true}>True</option>
              <option value={false}>False</option>
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
        <Col md={6}>
          <Form.Group className="mb-4">
            <Form.Label>Outline Colour</Form.Label>
            <Form.Select
              value={matchSettings.outlineColour}
              onChange={(event) =>
                setMatchSettings({
                  ...matchSettings,
                  outlineColour: event.target.value,
                })
              }
            >
              <option value="Green">Green</option>
              <option value="Red">Red</option>
              <option value="Blue">Blue</option>
              <option value="Yellow">Yellow</option>
              <option value="White">White</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <div className="settings-preview-panel">
        <div className="text-center mb-3">
          <strong>Capture Page Preview</strong>
          <div className="text-muted small">
            Preview of the selected zone outline
          </div>
        </div>

        <div className="settings-capture-preview">
          <p className="settings-preview-selected-text">
            Zone Selected: M (Midfield)
          </p>

          <div className="settings-preview-zone-row">
            {["A", "B", "M", "C", "D"].map((zone) => (
              <div
                key={zone}
                className={`settings-preview-zone ${
                  zone === "M" ? "settings-preview-zone-selected" : ""
                }`}
                style={
                  zone === "M"
                    ? {
                        borderColor: matchSettings.outlineColour,
                      }
                    : {}
                }
              >
                {zone}
              </div>
            ))}
          </div>

          <div className="settings-preview-direction">
            ◀━━━━━━
          </div>

          <div className="settings-preview-team-selector">
            <div className="settings-preview-team settings-preview-team-red">
              Reds
            </div>

            <div className="settings-preview-flip">
              🔄
            </div>

            <div className="settings-preview-team">
              Away
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------- SECURITY UI ----------------
  const renderSecurity = () => (
    <div className="settings-section-panel">
      <div className="text-center mb-4">
        <h4>Security</h4>
        <p className="text-muted mb-0">
          Manage password and user access levels.
        </p>
      </div>

      <div className="d-flex justify-content-between align-items-center gap-3 p-3 border-bottom">
        <div>
          <strong>Change Password</strong>
          <div className="text-muted small">
            Update the password used to access the app.
          </div>
        </div>

        <Button
          className="settings-outline-button"
          style={controlButtonStyle}
          onClick={() => setShowPasswordModal(true)}
        >
          Change Password
        </Button>
      </div>

      <div className="d-flex justify-content-between align-items-center gap-3 p-3 border-bottom">
        <div>
          <strong>Logout</strong>
          <div className="text-muted small">
            Sign out of your Reds account.
          </div>
        </div>

        <Button
          className="settings-danger-button"
          style={controlButtonStyle}
          onClick={() => {
            window.location.href = "/logout";
          }}
        >
          Logout
        </Button>
      </div>

      {profile.role === "Owner" && (
        <div className="mt-4">
          <h5>Modify Access Levels</h5>
          <p className="text-muted small">
            This section is available to the Owner only.
          </p>

          {Object.keys(accessLevels).map((role) => (
            <Row
              className="align-items-center py-2 border-bottom"
              key={role}
            >
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
    <div className="settings-section-panel">
      <div className="text-center mb-4">
        <h4>Data & Export</h4>
        <p className="text-muted mb-0">Download app data in CSV format.</p>
      </div>

      <div className="settings-data-card border p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="settings-data-icon d-flex align-items-center justify-content-center text-white fw-bold">
            CSV
          </div>
          <div>
            <strong>Export Data as CSV</strong>
            <div className="text-muted small">
              Download the available match and event data.
            </div>
          </div>
        </div>
        <Button
          className="settings-danger-button"
          disabled
        >
          Export CSV
        </Button>
      </div>
    </div>
  );

  // ---------------- HELP UI ----------------
  const renderHelp = () => (
    <div className="settings-section-panel">
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
          <div className="settings-help-number d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0">
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
      className={`settings-page ${
        accessibility.darkMode ? "settings-page-dark-mode" : ""
      }`}
    >
      <div
        className="dashboard-content settings-content-wrapper">
        <div className="settings-title-box">
          <button
            className="settings-back-button"
            onClick={() => navigate("/dashboard")}
            aria-label="Go Back"
          >
            ←
          </button>

          <h3>Settings</h3>
          <h5>Manage your Reds app preferences</h5>
        </div>

        <Row className="settings-row">
          <Col xl={3} lg={4} md={4} className="mb-3 mb-md-0">
            <div className="settings-menu-panel">
              <h5 className="settings-panel-title">Settings Menu</h5>

              {settingsSections.map((section) => (
                <Button
                  key={section.label}
                  variant="dark"
                  className={`settings-menu-button ${
                    activeSection === section.label
                      ? "settings-menu-button-active"
                      : ""
                  }`}
                  style={{
                    minHeight: accessibility.largeButtons ? 60 : 50,
                  }}
                  onClick={() => setActiveSection(section.label)}
                >
                  <span className="settings-menu-icon d-inline-flex align-items-center justify-content-center me-3">
                    {section.icon}
                  </span>
                  <span>{section.label}</span>
                </Button>
              ))}
            </div>
          </Col>

          <Col xl={7} lg={8} md={8}>
            <div className="settings-main-panel">{renderActiveSection()}</div>

            {!["Data & Export", "Help"].includes(activeSection) && (
              <div className="settings-save-panel d-flex justify-content-between align-items-center gap-3">
                <Button
                  className="settings-danger-button"
                  onClick={handleSave}
                  style={controlButtonStyle}
                >
                  Save Changes
                </Button>

                <Button
                  className="settings-reset-button"
                  onClick={restoreDefaultSettings}
                  style={controlButtonStyle}
                >
                  Restore Defaults
                </Button>
              </div>
            )}

          </Col>
        </Row>

        {saveMessage && (
          <div
            className="settings-toast position-fixed bottom-0 end-0 m-4 px-3 py-2"
            role="status"
          >
            {saveMessage}
          </div>
        )}
      </div>
      <Modal
        show={showKeybindModal}
        onHide={() => setShowKeybindModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Keybinds</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {Object.entries(keybinds).map(([action, key]) => (
            <Row key={action} className="mb-3 align-items-center">
              <Col md={6}>
                <strong>{action.replaceAll("_", " ")}</strong>
              </Col>

              <Col md={6}>
                <Form.Control
                  readOnly
                  value={editingKey === action ? "Enter keybind..." : key}
                  onFocus={() => setEditingKey(action)}
                  onBlur={() => setEditingKey(null)}
                  onKeyDown={(event) => {
                    event.preventDefault();

                    setKeybinds({
                      ...keybinds,
                      [action]: event.key,
                    });

                    setEditingKey(null);
                  }}
                />
              </Col>
            </Row>
          ))}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowKeybindModal(false)}
          >
            Cancel
          </Button>

          <Button
            className="settings-danger-button"
            onClick={saveKeybinds}
          >
            Save Keybinds
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showPasswordModal}
        onHide={() => {
          setShowPasswordModal(false);
          setPasswordForm({
            currentPassword: "",
            newPassword: "",
          });
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Current Password</Form.Label>
            <Form.Control
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: event.target.value,
                })
              }
              placeholder="Enter current password"
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: event.target.value,
                })
              }
              placeholder="Enter new password"
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {      //reset the password form and close modal when cancel is clicked
              setShowPasswordModal(false);
              setPasswordForm({
                currentPassword: "",
                newPassword: "",
              });
            }}
          >
            Cancel
          </Button>

          <Button
            className="settings-danger-button"
            onClick={updatePassword}
          >
            Update Password
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
}

export default Settings;