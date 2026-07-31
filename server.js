require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bookingsRouter = require("./routes/bookings");
const reminders = require("./reminders");
const { init } = require("./db");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
  })
);
app.use(express.json());

app.use("/api", bookingsRouter);

app.get("/", (req, res) => {
  res.send("API do AgendaUnhas rodando ✅");
});

const PORT = process.env.PORT || 3000;

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      reminders.start();
    });
  })
  .catch((err) => {
    console.error("Erro ao iniciar o banco de dados:", err);
    process.exit(1);
  });
