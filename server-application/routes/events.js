import express from 'express';

const router = express.Router();

// ============================== POST https://localhost:3000/events ==============================
// Log a game event
router.post('/', async (req, res) => {
  try {
    const { game_id, event_code, zone_id, team_id, game_clock, game_half } = req.body;

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
router.get('/game/:id', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // Parse to integer base-10

    const { game_id, event_code, zone_id, team_id, game_clock, game_half } = req.body;

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
router.delete('/:id', async (req, res) => {
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
