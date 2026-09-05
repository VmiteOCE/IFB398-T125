import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

const VALID_EVENT_CODES = [
  "P", // Pass
  "K", // Kick
  "C", // Catch
  "R", // Ruck
  "S", // Scrum
  "E", // Penalty
  "A", // Advantage
  "T", // Turnover
  "L", // Lineout
  "V", // Conversion
  "Y", // Try
  "M", // Maul
  "/", // Ball in play
  ".", // Ball out of play
];

const VALID_ZONES = ["A", "B", "M", "C", "D"];

function validateEventInput({game_id, event_code, zone_id, team_id, game_clock, game_half}) {
    if (!Number.isInteger(game_id) || game_id <= 0) return "A valid game ID is required.";
    if (!VALID_EVENT_CODES.includes(event_code)) return "Invalid event code.";
    if (!VALID_ZONES.includes(zone_id)) return "Invalid zone.";
    if (![1, 2].includes(team_id)) return "Invalid team ID.";
    if (typeof game_clock !== "number" || game_clock < 0) return "A valid game clock is required.";
    if (![1, 2].includes(game_half)) return "Invalid game half.";

    return null;
}

// ============================== POST https://localhost:3000/events ==============================
// Log a game event
router.post('/', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const { game_id, event_code, zone_id, team_id, game_clock, game_half } = req.body;

    const validationError = validateEventInput({game_id, event_code, zone_id, team_id, game_clock, game_half});

    if (validationError) {
        return res.status(400).json({
            error: true,
            message: validationError,
        });
    }

    const [insertedId] = await req.db('events')
      .insert({
        game_id,
        event_code,
        zone_id,
        team_id,
        game_clock,
        game_half
      });

    // Success response - 201 Created
    res.status(201).json({ error: false, message: "Event logged successfully", event_id: insertedId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database write error" });
  }
});

// ============================== GET https://localhost:3000/events/game/{id} ==============================
// Return all events from a specific game_id
router.get('/game/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // Parse to integer base-10

    const [game, events] = await Promise.all([
      req.db('games')
        .where('game_id', '=', id).first(),
      req.db('events')
        .select('*')
        .where('game_id', '=', id)
        .orderBy('game_clock', 'asc') // Primary: Chronological order via game_clock
        .orderBy('event_id', 'asc')   // Secondary: Sort by event_id as a tie-breaker for identical timestamps
    ]);

    // Check if game exists
    if (!game) {
      return res.status(404).json({ error: true, message: "Game not found" });
    }

    // Success response - 200 OK (Returns empty array if no events exist for selected game_id)
    res.status(200).json({ error: false, message: "Success", events: events });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database read error" });
  }
});

// ============================== GET https://localhost:3000/events/{id} ==============================
// Return a single event with the provided event_id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // Parse to integer base-10

    const event = await req.db('events')
      .select('*')
      .where('event_id', '=', id)
      .first() // Get single game object instead of array

    // Check if event exists
    if (!event) {
      return res.status(404).json({ error: true, message: "Event not found" });
    }

    // Success response - 200 OK
    res.status(200).json({ error: false, message: "Success", event: event });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database read error" });
  }
});

// ============================== PUT https://localhost:3000/events/{id} ==============================
// Update the stored data for a given event_id
router.put('/:id', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // Parse to integer base-10

    const { game_id, event_code, zone_id, team_id, game_clock, game_half } = req.body;

    const validationError = validateEventInput({game_id, event_code, zone_id, team_id, game_clock, game_half});

    if (validationError) {
        return res.status(400).json({
            error: true,
            message: validationError,
        });
    }

    const updated = await req.db('events')
      .where('event_id', '=', id)
      .update({
        game_id,
        event_code,
        zone_id,
        team_id,
        game_clock,
        game_half
      });

    if (updated === 0) {
      return res.status(404).json({ error: true, message: "Event not found" });
    }

    // Success response - 200 OK
    res.status(200).json({ error: false, message: "Event updated successfully", event_id: id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database update error" });
  }
});

// ============================== DELETE https://localhost:3000/events/{id} ==============================
// Delete the event with a given event_id
router.delete('/:id', verifyToken, requireRole('admin', 'editor'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // Parse to integer base-10

    const deleted = await req.db('events')
      .where('event_id', '=', id)
      .del();

    if (deleted === 0) {
      return res.status(404).json({ error: true, message: "Event not found" });
    }

    // Success response - 200 OK
    res.status(200).json({ error: false, message: "Event deleted successfully", event_id: id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database deletion error" });
  }
});

export default router;
