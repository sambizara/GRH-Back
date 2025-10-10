// routes/confirmation_routes.js
const express = require("express");
const {
    confirmerStagiaire,
    rejeterStagiaire,
    getStagiairesEnAttente,
    getHistoriqueConfirmations
} = require("../controllers/confirmation_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// 🔹 SALARIE : Récupérer les stagiaires en attente de confirmation
router.get("/stagiaires-en-attente", auth(["SALARIE"]), getStagiairesEnAttente);

// 🔹 SALARIE : Confirmer un stagiaire
router.post("/:stageId/confirmer", auth(["SALARIE"]), confirmerStagiaire);

// 🔹 SALARIE : Rejeter un stagiaire
router.post("/:stageId/rejeter", auth(["SALARIE"]), rejeterStagiaire);

// 🔹 SALARIE : Historique des confirmations/rejets
router.get("/historique", auth(["SALARIE"]), getHistoriqueConfirmations);

module.exports = router;