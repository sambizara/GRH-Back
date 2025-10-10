require("dotenv").config();
console.log("JWT_SECRET =", process.env.JWT_SECRET);

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const app = express();
app.use(cors({ 
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Connexion à la base de données
connectDB();

// Routes
app.use("/api/auth", require("./src/routes/auth_routes"));
app.use("/api/users", require("./src/routes/user_routes"));
app.use("/api/conges", require("./src/routes/conge_routes"));
app.use("/api/attestations", require("./src/routes/attestation_routes"));
app.use("/api/presences", require("./src/routes/presence_routes"));
app.use("/api/services", require("./src/routes/service_routes"));
app.use("/api/contrats", require("./src/routes/contrat_routes"));
app.use("/api/rapports", require("./src/routes/rapport_routes"));
app.use("/api/notifications", require("./src/routes/notification_routes"));
app.use("/api/stages", require("./src/routes/stage_routes"));
app.use("/api/pdf", require("./src/routes/pdf_routes"));
app.use("/api/confirmations", require("./src/routes/confirmation_routes"));

// Test route protégée
const auth = require("./src/middlewares/auth_middleware");
app.get("/api/admin", auth(["ADMIN_RH"]), (req, res) => {
    res.json({ message: "Bienvenue, Admin RH !" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});