const cron = require("node-cron");
const { db } = require("./db");

const {
  ZAPI_INSTANCE_ID,
  ZAPI_TOKEN,
  ZAPI_CLIENT_TOKEN, // opcional, mas recomendado (Token de Segurança da conta Z-API)
  SALON_NAME = "AgendaUnhas",
} = process.env;

function rowsToObjects(result) {
  return result.rows.map((row) => {
    const obj = {};
    result.columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

// Assume números brasileiros. Se a cliente digitar sem o 55, adiciona automaticamente.
// A Z-API espera só dígitos, sem "+" e sem formatação: DDI + DDD + número.
function formatPhone(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

function formatDateBR(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

async function sendWhatsApp(phone, message) {
  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ZAPI_CLIENT_TOKEN ? { "Client-Token": ZAPI_CLIENT_TOKEN } : {}),
    },
    body: JSON.stringify({ phone, message }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Z-API respondeu ${res.status}: ${text}`);
  }
  return res.json();
}

// Verifica agendamentos entre 23h e 25h no futuro (janela de 2h em torno das 24h)
// e envia o lembrete uma única vez por agendamento.
async function checkAndSendReminders() {
  if (!ZAPI_INSTANCE_ID || !ZAPI_TOKEN) {
    console.warn("[reminders] Z-API não configurada (.env incompleto) — pulando esta verificação.");
    return;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const pendingResult = await db.execute("SELECT * FROM bookings WHERE reminderSent = 0");
  const pending = rowsToObjects(pendingResult);

  for (const b of pending) {
    const apptDateTime = new Date(`${b.date}T${b.startTime}:00`);
    if (apptDateTime >= windowStart && apptDateTime <= windowEnd) {
      try {
        await sendWhatsApp(
          formatPhone(b.clientPhone),
          `Oi, ${b.clientName}! Passando para lembrar do seu horário amanhã (${formatDateBR(b.date)}) às ${b.startTime} — ${b.serviceName} com ${b.professionalName}, no ${SALON_NAME}. Até lá! 💅`
        );
        await db.execute({ sql: "UPDATE bookings SET reminderSent = 1 WHERE id = ?", args: [b.id] });
        console.log(`[reminders] Lembrete enviado para ${b.clientName} (agendamento ${b.id})`);
      } catch (err) {
        console.error(`[reminders] Falha ao enviar para ${b.clientName}:`, err.message);
      }
    }
  }
}

function start() {
  // roda a cada 30 minutos, então nenhum agendamento passa mais de 30min sem ser checado
  cron.schedule("*/30 * * * *", checkAndSendReminders);
  console.log("[reminders] Agendador de lembretes iniciado (verifica a cada 30min).");
}

module.exports = { start, checkAndSendReminders };
