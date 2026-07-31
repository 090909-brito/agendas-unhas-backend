const { createClient } = require("@libsql/client");
const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// Em desenvolvimento local, sem configurar nada, os dados ficam num arquivo local.
// Em produção (ex: Render), configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN
// com os dados do seu banco Turso (gratuito, e ao contrário do disco do Render
// free tier, os dados NÃO são apagados quando o servidor reinicia/dorme).
const url = process.env.TURSO_DATABASE_URL || `file:${path.join(dataDir, "agenda.db")}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient(authToken ? { url, authToken } : { url });

async function init() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      serviceId TEXT NOT NULL,
      serviceName TEXT NOT NULL,
      duration INTEGER NOT NULL,
      price REAL NOT NULL,
      professionalId TEXT NOT NULL,
      professionalName TEXT NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      clientName TEXT NOT NULL,
      clientPhone TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      reminderSent INTEGER NOT NULL DEFAULT 0
    );
  `);
}

module.exports = { db, init };
