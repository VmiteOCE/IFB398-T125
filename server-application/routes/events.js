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

    // Success response
    res.json({ error: false, message: "Event logged successfully", event_id: insertedId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database write error" });
  }
});

// ============================== GET https://localhost:3000/events/game/{id} ==============================
// Return all events from a specific game_id
router.get('/game/:id', async (req, res) => {
  try {
    const events = await req.db
      .from('events')
      .select('*')
      .where('game_id', '=', req.params.id)
      .orderBy('game_clock', 'asc') // Primary: Chronological order via game_clock
      .orderBy('event_id', 'asc')   // Secondary: Sort by event_id as a tie-breaker for identical timestamps

    // Check for empty return array
    if (events.length === 0) {
      return res.status(404).json({ error: true, message: "No events found" });
    }

    // Success response
    res.json({ error: false, message: "Success", events: events });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database read error" });
  }
});

// ============================== PUT https://localhost:3000/events/update/{id} ==============================
// Update the stored data for a given event_id
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;

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

    // Success response
    res.json({ error: false, message: "Event updated successfully", event_id: id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database update error" });
  }
});

// ============================== DELETE https://localhost:3000/events/delete/{id} ==============================
// Delete the event with a given event_id
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await req.db('events')
      .where('event_id', '=', id)
      .del();

    if (deleted === 0) {
      return res.status(404).json({ error: true, message: "Event not found" });
    }

    // Success response
    res.json({ error: false, message: "Event deleted successfully", event_id: id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database deletion error" });
  }
});

export default router;
