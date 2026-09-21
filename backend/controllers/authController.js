const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// LOGIN
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("LOGIN REQUEST:");
    console.log("Username:", JSON.stringify(username));
    console.log("Password:", JSON.stringify(password));
    console.log("Password length:", password ? password.length : 0);

    // VALIDATION
    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    // FIND USER
    const [users] = await db.query(
      `
      SELECT
        id,
        username,
        password,
        role,
        created_at
      FROM users
      WHERE username = ?
      `,
      [username.trim()],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const user = users[0];

    // CHECK PASSWORD
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // CHECK JWT SECRET
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT secret is not configured.",
      });
    }

    // CREATE TOKEN
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      },
    );

    // RESPONSE
    res.json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
};

module.exports = {
  login,
};
