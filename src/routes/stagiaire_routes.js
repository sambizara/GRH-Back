// routes/stagiaire_routes.js
const express = require("express");
const {
  getStagiairesEnAttente,
  confirmerStagiaire,
  rejeterStagiaire,
  getHistoriqueConfirmations,
  getMesStagiairesEncadres
} = require("../controllers/stagiaire_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// 🔹 SALARIE : Récupérer les stagiaires en attente de confirmation
router.get("/en-attente", auth(["SALARIE"]), getStagiairesEnAttente);

// 🔹 SALARIE : Confirmer un stagiaire et créer son stage
router.post("/:stagiaireId/confirmer", auth(["SALARIE"]), confirmerStagiaire);

// 🔹 SALARIE : Rejeter un stagiaire
router.post("/:stagiaireId/rejeter", auth(["SALARIE"]), rejeterStagiaire);

// 🔹 SALARIE : Historique des confirmations/rejets
router.get("/historique", auth(["SALARIE"]), getHistoriqueConfirmations);

// 🔹 SALARIE : Mes stagiaires encadrés
router.get("/mes-stagiaires", auth(["SALARIE"]), getMesStagiairesEncadres);

module.exports = router;