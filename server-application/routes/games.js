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

    // Success response
    res.json({ error: false, message: "Game created successfully", game_id: insertedId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database write error" });
  }
});

// ============================== GET https://localhost:3000/games ==============================
// Get a filtered, sorted and paginated list of games
router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      start = '',
      end = '',
      sortBy = 'start_time',
      sortOrder = 'asc',
      page = '1',
      limit = '20'
    } = req.query;

    const allowedSortFields = [
      'game_id',
      'game_name',
      'vs_team',
      'start_time',
      'game_status'
    ];

    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'start_time';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    const parsedPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
    const offset = (parsedPage - 1) * parsedLimit;

    const query = req.db.from('games');

    // Search game name or opposing team
    if (search.trim()) {
      const searchValue = `%${search.trim()}%`;

      query.where(function () {
        this
          .where('game_name', 'like', searchValue)
          .orWhere('vs_team', 'like', searchValue);
      });
    }

    if (status)
      query.where('game_status', '=', status);

    // Filter games starting on or after this time
    if (start)
      query.where('start_time', '>=', start);

    // Filter games starting on or before this time
    if (end)
      query.where('start_time', '<=', end);

    // Count filtered games before pagination
    const countResult = await query
      .clone()
      .count({ total: 'game_id' })
      .first();

    // Get filtered games
    const games = await query
      .clone()
      .select('*')
      .orderBy(safeSortBy, safeSortOrder)
      .limit(parsedLimit)
      .offset(offset);

    const total = Number(countResult?.total ?? 0);
    const totalPages = Math.ceil(total / parsedLimit);

    // Empty results are valid, so return 200 with an empty array
    res.json({
      error: false,
      message: 'Success',
      games: games,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: total,
        totalPages: totalPages,
        nextPage:
          parsedPage < totalPages
            ? parsedPage + 1
            : null,
        previousPage:
          parsedPage > 1
            ? parsedPage - 1
            : null
      }
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: true,
      message: 'Database read error'
    });
  }
});

// ============================== PUT https://localhost:3000/games/update/{id} ==============================
// Update the stored data for a given game_id
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;

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

    // Success response
    res.json({ error: false, message: "Game updated successfully", game_id: id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database update error" });
  }
});

// ============================== DELETE https://localhost:3000/games/delete/{id} ==============================
// Delete the game with a given game_id
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete game events to allow for game deletion (foreign key restraint)
    await req.db('events')
      .where('game_id', '=', id)
      .del();

    // Delete game record
    const deleted = await req.db('games')
      .where('game_id', '=', id)
      .del();

    if (deleted === 0) {
      return res.status(404).json({ error: true, message: "Game not found" });
    }

    // Success response
    res.json({ error: false, message: "Game deleted successfully", game_id: id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database deletion error" });
  }
});

// ============================== GET https://localhost:3000/games/{id} ==============================
// Get details for a specific game_id
router.get('/:id', async (req, res) => {
  try {
    const game = await req.db
      .from('games')
      .select('*')
      .where('game_id', '=', req.params.id)
      .first() // Get single game object instead of array

    // Check if game exists
    if (!game) {
      return res.status(404).json({ error: true, message: "Game not found" });
    }

    // Success response
    res.json({ error: false, message: "Success", game: game });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database read error" });
  }
});

export default router;
