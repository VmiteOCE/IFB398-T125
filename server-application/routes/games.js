import express from 'express';

const router = express.Router();

// ============================== GET / ==============================
router.get('/', (req, res) => {
  req.db
    .from('games')
    .select('*')
    .then((games) => {
      // Check for empty return array
      if (games.length === 0) {
        return res.status(404).json({ error: true, message: "No games found" });
      }
      // Success response
      res.json({ error: false, message: "Success", games: games });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: true, message: "Database read error" });
    });
});

// ============================== GET /{id} ==============================
router.get('/:id', (req, res) => {
  req.db
    .from('games')
    .select('*')
    .where('game_id', '=', req.params.id)
    .first() // Get single game object instead of array
    .then((game) => {
      // Check if game exists
      if (!game) {
        return res.status(404).json({ error: true, message: "Game not found" });
      }
      // Success response
      res.json({ error: false, message: "Success", game: game });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: true, message: "Database read error" });
    });
});

export default router;
