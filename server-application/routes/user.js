import express from 'express';

const router = express.Router();

// ============================== POST https://localhost:3000/user/login ==============================
// User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if both username and password are provided
    if (!username || !password) {
      return res.status(400).json({ error: true, message: "Please provide both a username and password." });
    }

    const user = await req.db('users')
      .where('username', '=', username)
      .first(); // Get single user object instead of array

    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: true, message: "Invalid username or password" });
    }

    // Plaintext password validation
    if (user.password !== password) {
      return res.status(401).json({ error: true, message: "Invalid username or password" });
    }

    // Success response
    res.json({ error: false, message: "Login successful!", user: user });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: true, message: "Database error occurred" });
  }
});

export default router;
