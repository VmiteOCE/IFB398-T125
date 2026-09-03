import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ============================== POST https://localhost:3000/user ==============================
// Create a user
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Ensure all parameters are present
    if (!username || !password || !role) {
      return res.status(400).json({
        error: true,
        message: "Please provide 'username', 'password', and 'role'."
      });
    }

    // Check if user already exists
    const existingUser = await req.db('users').where('username', '=', username).first();
    if (existingUser) {
      return res.status(409).json({ error: true, message: "Username already exists." });
    }

    // Check for valid user role
    const allowedRoles = ['editor', 'viewer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: true, message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}` });
    }

    // Hash password and insert into database
    const hashedPassword = await bcrypt.hash(password, 10);
    await req.db('users').insert({
      username,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      error: false,
      message: `User '${username}' created successfully with role '${role}'.`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database error" });
  }
});

// ============================== GET https://localhost:3000/user ==============================
// Get list of users
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // Exclude password hashes from the returned list!
    const users = await req.db('users').select('username', 'role');
    res.status(200).json({ error: false, users });
  } catch (err) {
    res.status(500).json({ error: true, message: "Database read error" });
  }
});

// ============================== PATCH https://localhost:3000/user ==============================
// Modify the role or password of another user. Available only to admins
router.patch('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, role, password } = req.body;

    if (!username) {
      return res.status(400).json({
        error: true,
        message: "Please provide the username of the account to update."
      });
    }

    // Prevent modifying own admin account on the management screen
    if (username === req.user.username) {
      return res.status(400).json({
        error: true,
        message: "You cannot modify your own admin account from user management. Use /user/password to change your password."
      });
    }

    if (!role && !password) {
      return res.status(400).json({
        error: true,
        message: "Please provide at least a role or a password to update."
      });
    }

    const updateData = {};

    if (role) {
      const allowedRoles = ['editor', 'viewer'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          error: true,
          message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`
        });
      }
      updateData.role = role;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await req.db('users')
      .where('username', '=', username)
      .update(updateData);

    if (updated === 0) {
      return res.status(404).json({ error: true, message: "User not found." });
    }

    res.status(200).json({
      error: false,
      message: `User '${username}' updated successfully.`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database error" });
  }
});

// ============================== DELETE https://localhost:3000/user ==============================
// Delete a user
router.delete('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: true, message: "Please provide a 'username' to delete." });
    }

    // Prevent admin from deleting themselves
    if (username === req.user.username) {
      return res.status(400).json({ error: true, message: "You cannot delete your own admin account." });
    }

    const deleted = await req.db('users')
      .where('username', '=', username)
      .del();

    if (deleted === 0) {
      return res.status(404).json({ error: true, message: "User not found." });
    }

    res.status(200).json({
      error: false,
      message: `User '${username}' deleted successfully.`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database error" });
  }
});

// ============================== POST https://localhost:3000/user/login ==============================
// User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: true,
        message: "Please provide both a username and password."
      });
    }

    // Get single user object insead of array
    const user = await req.db('users')
      .where('username', '=', username)
      .first();

    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: true, message: "Invalid username or password" });
    }

    // Compare plaintext request password with stored hash
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: true, message: "Invalid username or password" });
    }

    // Create Bearer Token (expires in 24 hours)
    const token = jwt.sign({
      username: user.username,
      role: user.role
    },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return token to user
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      error: false,
      message: "Login successful",
      username: user.username,
      role: user.role
    });


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Login error" });
  }
});

// ============================== PUT https://localhost:3000/user/password ==============================
// Self-service password update for the logged in user
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        error: true,
        message: "Please provide both 'current_password' and 'new_password'."
      });
    }

    // Fetch user record
    const user = await req.db('users')
      .where('username', '=', req.user.username)
      .first();

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found." });
    }

    // Verify current password
    const match = await bcrypt.compare(current_password, user.password);
    if (!match) {
      return res.status(401).json({ error: true, message: "Incorrect current_password." });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await req.db('users')
      .where('username', '=', req.user.username)
      .update({ password: hashedPassword });

    res.status(200).json({
      error: false,
      message: "Password updated successfully."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database error updating password." });
  }
});

// ============================== GET https://localhost:3000/user/keybinds ==============================
// Get keybinds for logged in user
router.get('/keybinds', verifyToken, async (req, res) => {
  try {
    const user = await req.db('users')
      .where('username', '=', req.user.username)
      .select('keybinds')
      .first();

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found." });
    }

    // Parse string stored in SQLite into JSON, or return JSON if already formatted correctly
    // Returns null if no keybinds are saved
    let jsonKeybinds = null;
    if (user.keybinds && typeof user.keybinds === 'string') {
      try {
        jsonKeybinds = JSON.parse(user.keybinds);
      } catch {
        jsonKeybinds = null;
      }
    }

    res.status(200).json({
      error: false,
      keybinds: jsonKeybinds
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database error reading keybinds." });
  }
});

// ============================== PUT https://localhost:3000/user/keybinds ==============================
// Replace full keymap for logged in user
router.put('/keybinds', verifyToken, async (req, res) => {
  try {
    const keymap = req.body;

    // Validate keybinds payload
    if (!keymap || typeof keymap !== 'object' || Array.isArray(keymap)) {
      return res.status(400).json({
        error: true,
        message: "Request body must be a JSON object containing key-value keybind mappings."
      });
    }

    // Ensure request body is not empty
    const keys = Object.keys(keymap);
    if (keys.length === 0) {
      return res.status(400).json({
        error: true,
        message: "Keybind object cannot be empty."
      });
    }

    // Ensure KVP values are all strings
    const validKeybinds = Object.values(keymap).every(val => typeof val === 'string');
    if (!validKeybinds) {
      return res.status(400).json({
        error: true,
        message: "All keybind values must be strings representing keys (e.g., 'R', 'Space')."
      });
    }

    const keybindData = JSON.stringify(keymap);

    const updated = await req.db('users')
      .where('username', '=', req.user.username)
      .update({ keybinds: keybindData });

    if (updated === 0) {
      return res.status(404).json({ error: true, message: "User not found." });
    }

    res.status(200).json({
      error: false,
      message: "Keybinds updated successfully.",
      keybinds: keymap
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database error updating keybinds." });
  }
});

// ============================== DELETE https://localhost:3000/user/keybinds ==============================
// Reset keybinds for logged in user
router.delete('/keybinds', verifyToken, async (req, res) => {
  try {
    const updated = await req.db('users')
      .where('username', '=', req.user.username)
      .update({ keybinds: null });

    if (updated === 0) {
      return res.status(404).json({ error: true, message: "User not found." });
    }

    res.status(200).json({
      error: false,
      message: "Keybinds successfully reset to default.",
      keybinds: null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database error resetting keybinds." });
  }
});

// ============================== GET https://localhost:3000/user/settings ==============================
// Get settings for logged in user
router.get('/settings', verifyToken, async (req, res) => {
  try {
    const user = await req.db('users')
      .where('username', '=', req.user.username)
      .select('settings')
      .first();

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found." });
    }

    // Parse string stored in SQLite into JSON, or return JSON if already formatted correctly
    // Returns null if no settings are saved
    let jsonSettings = null;
    if (user.settings && typeof user.settings === 'string') {
      try {
        jsonSettings = JSON.parse(user.settings);
      } catch {
        jsonSettings = null;
      }
    }

    res.status(200).json({
      error: false,
      settings: jsonSettings
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database error reading settings." });
  }
});

// ============================== PUT https://localhost:3000/user/settings ==============================
// Replace full settings map for logged in user
router.put('/settings', verifyToken, async (req, res) => {
  try {
    const settingsmap = req.body;

    // Validate settings payload
    if (!settingsmap || typeof settingsmap !== 'object' || Array.isArray(settingsmap)) {
      return res.status(400).json({
        error: true,
        message: "Request body must be a JSON object containing key-value settings."
      });
    }

    // Ensure request body is not empty
    const settings = Object.keys(settingsmap);
    if (settings.length === 0) {
      return res.status(400).json({
        error: true,
        message: "Settings object cannot be empty."
      });
    }

    // No validation for KVP data types

    const settingsData = JSON.stringify(settingsmap);

    const updated = await req.db('users')
      .where('username', '=', req.user.username)
      .update({ settings: settingsData });

    if (updated === 0) {
      return res.status(404).json({ error: true, message: "User not found." });
    }

    res.status(200).json({
      error: false,
      message: "Settings updated successfully.",
      settings: settingsmap
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database error updating settings." });
  }
});

// ============================== DELETE https://localhost:3000/user/settings ==============================
// Reset settings for logged in user
router.delete('/settings', verifyToken, async (req, res) => {
  try {
    const updated = await req.db('users')
      .where('username', '=', req.user.username)
      .update({ settings: null });

    if (updated === 0) {
      return res.status(404).json({ error: true, message: "User not found." });
    }

    res.status(200).json({
      error: false,
      message: "Settings successfully reset to default.",
      settings: null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: "Database error resetting settings." });
  }
});

// ============================== GET https://localhost:3000/user/verify ==============================
// Basic Auth Check: Any logged-in user
router.get('/verify', verifyToken, (req, res) => {
  res.status(200).json({
    error: false,
    message: "Token is valid!",
    token: req.user
  });
});

// Check for editor permissions
router.get('/editor-test', verifyToken, requireRole('admin', 'editor'), (req, res) => {
  res.status(200).json({
    error: false,
    message: `Welcome ${req.user.username}. You have editor-level privileges.`
  });
});

// Check for editor permissions
router.get('/admin-test', verifyToken, requireRole('admin'), (req, res) => {
  res.status(200).json({
    error: false,
    message: `Welcome ${req.user.username}. You have admin-level privileges.`
  });
});



// ============================== POST https://localhost:3000/user/logout ==============================
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    res.status(200).json({
        error: false,
        message: 'Logged out successfully'
    });
});

export default router;

