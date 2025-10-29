const express = require("express");
const {
  demandeSalarie,
  previewSalarie,
  demandeStagiaire,
  genererAutomatiqueStage,
  generateAttestation,
  downloadAttestation,
  getMesAttestations,
  getHistorique
} = require("../controllers/attestation_controller");
const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// 🧑‍💼 Routes pour salarié
router.post("/salarie/demande", auth(["SALARIE"]), demandeSalarie);
router.post("/salarie/preview", auth(["SALARIE"]), previewSalarie);

// 🚫 Les stagiaires ne font plus de demande manuelle
router.post("/stagiaire/demande", auth(["STAGIAIRE"]), demandeStagiaire);

// ✅ Récupération des attestations personnelles
router.get("/mes-attestations", auth(["SALARIE", "STAGIAIRE"]), getMesAttestations);

// 🧑‍💼 Admin RH
router.put("/generer/:id", auth(["ADMIN_RH"]), generateAttestation);
router.get("/download/:id", auth(["ADMIN_RH", "SALARIE", "STAGIAIRE"]), downloadAttestation);
router.get("/historique", auth(["ADMIN_RH"]), getHistorique);

module.exports = router;
