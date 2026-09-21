require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function createAdmin() {
  try {
    const username = "admin";
    const password = "admin123";

    const hashedPassword = await bcrypt.hash(password, 10);

    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ?",
      [username],
    );

    if (existing.length > 0) {
      await db.query(
        `
        UPDATE users
        SET password = ?, role = 'Admin'
        WHERE username = ?
        `,
        [hashedPassword, username],
      );

      console.log("Admin password updated.");
    } else {
      await db.query(
        `
        INSERT INTO users
        (username, password, role)
        VALUES (?, ?, 'Admin')
        `,
        [username, hashedPassword],
      );

      console.log("Admin account created.");
    }

    console.log("Username: admin");
    console.log("Password: admin123");

    process.exit(0);
  } catch (error) {
    console.error("Create admin error:", error);
    process.exit(1);
  }
}

createAdmin();
