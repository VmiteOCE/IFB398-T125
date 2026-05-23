import express from 'express';

const router = express.Router();

// ============================== POST / ==============================
router.post('/', (req, res) => {
  const { game_id, event_code, zone_id, team_id, game_clock, game_half } = req.body;

  req.db('game_events')
    .insert({
      game_id,
      event_code,
      zone_id,
      team_id,
      game_clock,
      game_half
    })
    .then(() => {
      res.status(201).json({ error: false, message: "Event logged successfully" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: true, message: "Database write error" });
    });
});

// ============================== GET /{id} ==============================
router.get('/:id', (req, res) => {
  req.db
    .from('events')
    .select('*')
    .where('game_id', '=', req.params.id)
    .orderBy('game_clock', 'asc') // Primary: Chronological order via game_clock
    .orderBy('event_id', 'asc')   // Secondary: Sort by event_id as a tie-breaker for identical timestamps
    .then((events) => {
      // Check for empty return array
      if (events.length === 0) {
        return res.status(404).json({ error: true, message: "No events found" });
      }
      // Success response
      res.json({ error: false, message: "Success", events: events });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: true, message: "Database read error" });
    });
});

export default router;
