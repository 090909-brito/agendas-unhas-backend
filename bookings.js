const express = require("express");
const crypto = require("crypto");
const { db } = require("../db");
const { CATEGORIES, SERVICES, PROFESSIONALS } = require("../services");

const router = express.Router();

const OPEN_HOUR = 9; // horário de abertura do salão
const CLOSE_HOUR = 19; // horário de fechamento do salão

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function minutesToHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function rowsToObjects(result) {
  return result.rows.map((row) => {
    const obj = {};
    result.columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

/* -------------------- serviços / profissionais -------------------- */

router.get("/services", (req, res) => {
  res.json({ categories: CATEGORIES, services: SERVICES, professionals: PROFESSIONALS });
});

/* -------------------- agendamentos -------------------- */

// GET /api/bookings?date=YYYY-MM-DD&professionalId=carol
router.get("/bookings", async (req, res) => {
  try {
    const { date, professionalId } = req.query;
    let sql = "SELECT * FROM bookings WHERE 1=1";
    const args = [];
    if (date) {
      sql += " AND date = ?";
      args.push(date);
    }
    if (professionalId) {
      sql += " AND professionalId = ?";
      args.push(professionalId);
    }
    sql += " ORDER BY date ASC, startTime ASC";
    const result = await db.execute({ sql, args });
    res.json(rowsToObjects(result));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao buscar agendamentos." });
  }
});

// POST /api/bookings — cria um novo agendamento, com checagem de conflito de horário
router.post("/bookings", async (req, res) => {
  try {
    const b = req.body || {};
    const required = [
      "serviceId", "serviceName", "duration", "price",
      "professionalId", "professionalName", "date",
      "startTime", "endTime", "clientName", "clientPhone",
    ];
    for (const field of required) {
      if (b[field] === undefined || b[field] === null || b[field] === "") {
        return res.status(400).json({ error: `Campo obrigatório faltando: ${field}` });
      }
    }

    const startMin = hhmmToMinutes(b.startTime);
    const endMin = hhmmToMinutes(b.endTime);

    const existingResult = await db.execute({
      sql: "SELECT * FROM bookings WHERE professionalId = ? AND date = ?",
      args: [b.professionalId, b.date],
    });
    const existing = rowsToObjects(existingResult);

    const conflict = existing.some((e) => {
      const eStart = hhmmToMinutes(e.startTime);
      const eEnd = hhmmToMinutes(e.endTime);
      return endMin > eStart && startMin < eEnd;
    });

    if (conflict) {
      return res.status(409).json({ error: "Esse horário acabou de ser reservado por outra cliente." });
    }

    const id = `bk_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO bookings
        (id, serviceId, serviceName, duration, price, professionalId, professionalName, date, startTime, endTime, clientName, clientPhone, createdAt, reminderSent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      args: [
        id, b.serviceId, b.serviceName, b.duration, b.price,
        b.professionalId, b.professionalName, b.date, b.startTime,
        b.endTime, b.clientName, b.clientPhone, createdAt,
      ],
    });

    const rowResult = await db.execute({ sql: "SELECT * FROM bookings WHERE id = ?", args: [id] });
    res.status(201).json(rowsToObjects(rowResult)[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao criar agendamento." });
  }
});

// DELETE /api/bookings/:id — cancela um agendamento
router.delete("/bookings/:id", async (req, res) => {
  try {
    const result = await db.execute({ sql: "DELETE FROM bookings WHERE id = ?", args: [req.params.id] });
    if (Number(result.rowsAffected) === 0) return res.status(404).json({ error: "Agendamento não encontrado." });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao cancelar agendamento." });
  }
});

// PATCH /api/bookings/:id/duration — SÓ o painel da profissional deve chamar isso
// body: { delta: 15 } ou { delta: -15 }
router.patch("/bookings/:id/duration", async (req, res) => {
  try {
    const { delta } = req.body || {};
    if (typeof delta !== "number") {
      return res.status(400).json({ error: "Informe 'delta' em minutos (ex: 15 ou -15)." });
    }

    const targetResult = await db.execute({ sql: "SELECT * FROM bookings WHERE id = ?", args: [req.params.id] });
    const target = rowsToObjects(targetResult)[0];
    if (!target) return res.status(404).json({ error: "Agendamento não encontrado." });

    const newDuration = Math.max(15, target.duration + delta);
    const startMin = hhmmToMinutes(target.startTime);
    const newEndMin = startMin + newDuration;

    if (newEndMin > CLOSE_HOUR * 60) {
      return res.status(400).json({ error: "Isso ultrapassa o horário de fechamento do salão." });
    }

    const othersResult = await db.execute({
      sql: "SELECT * FROM bookings WHERE professionalId = ? AND date = ? AND id != ?",
      args: [target.professionalId, target.date, target.id],
    });
    const others = rowsToObjects(othersResult);

    const conflict = others.some((o) => {
      const oStart = hhmmToMinutes(o.startTime);
      const oEnd = hhmmToMinutes(o.endTime);
      return newEndMin > oStart && startMin < oEnd;
    });

    if (conflict) {
      return res.status(409).json({ error: "Já existe outro agendamento logo em seguida. Não é possível estender." });
    }

    await db.execute({
      sql: "UPDATE bookings SET duration = ?, endTime = ? WHERE id = ?",
      args: [newDuration, minutesToHHMM(newEndMin), target.id],
    });

    const rowResult = await db.execute({ sql: "SELECT * FROM bookings WHERE id = ?", args: [target.id] });
    res.json(rowsToObjects(rowResult)[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao ajustar duração." });
  }
});

module.exports = router;
