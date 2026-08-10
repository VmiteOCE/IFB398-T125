import express from 'express';

const router = express.Router();

// ============================== POST https://localhost:3000/games ==============================
// Create a new game
router.post('/', async (req, res) => {
  try {
    const { game_name, vs_team, start_time, game_status } = req.body;

    const [insertedId] = await req.db('games')
      .insert({
        game_name,
        vs_team,
        start_time,
        game_status
      });

    // Success response - 201 Created
    res.status(201).json({ error: false, message: "Game created successfully", game_id: insertedId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database write error" });
  }
});

// ============================== GET https://localhost:3000/games ==============================
// Get a list with details of all games
router.get('/', async (req, res) => {
  try {
    const games = await req.db('games')
      .select('*');

    // Check for empty return array
    if (games.length === 0) {
      return res.status(404).json({ error: true, message: "No games found" });
    }

    // Success response - 200 OK
    res.status(200).json({ error: false, message: "Success", games: games });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database read error" });
  }
});

// ============================== GET https://localhost:3000/games/{id} ==============================
// Get details for a specific game_id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // Parse to integer base-10

    const game = await req.db('games')
      .select('*')
      .where('game_id', '=', id)
      .first() // Get single game object instead of array

    // Check if game exists
    if (!game) {
      return res.status(404).json({ error: true, message: "Game not found" });
    }

    // Success response - 200 OK
    res.status(200).json({ error: false, message: "Success", game: game });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database read error" });
  }
});

// ============================== PUT https://localhost:3000/games/{id} ==============================
// Update the stored data for a given game_id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // Parse to integer base-10

    const { game_name, vs_team, start_time, game_status } = req.body;

    const updated = await req.db('games')
      .where('game_id', '=', id)
      .update({
        game_name,
        vs_team,
        start_time,
        game_status
      });

    if (updated === 0) {
      return res.status(404).json({ error: true, message: "Game not found" });
    }

    // Success response - 200 OK
    res.status(200).json({ error: false, message: "Game updated successfully", game_id: id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database update error" });
  }
});

// ============================== DELETE https://localhost:3000/games/{id} ==============================
// Delete the game with a given game_id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // Parse to integer base-10

    // Delete game record (.onDelete('CASCADE') deletes children from events table)
    const deleted = await req.db('games')
      .where('game_id', '=', id)
      .del();

    if (deleted === 0) {
      return res.status(404).json({ error: true, message: "Game not found" });
    }

    // Success response - 200 OK
    res.status(200).json({ error: false, message: "Game deleted successfully", game_id: id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database deletion error" });
  }
});

export default router;
