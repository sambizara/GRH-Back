const express = require("express");
const { 
    demandeSalarie, 
    previewSalarie,
    demandeStagiaire, 
    checkEligibility,
    generateAttestation,
    downloadAttestation,
    getHistorique,
    getAllAttestations,
    getMesAttestations
} = require("../controllers/attestation_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// Routes pour Salarié et Stagiaire
router.post("/salarie/demande", auth(["SALARIE"]), demandeSalarie);
router.post("/salarie/preview", auth(["SALARIE"]), previewSalarie);
router.post("/stagiaire/demande", auth(["STAGIAIRE"]), demandeStagiaire);
router.get("/stagiaire/eligibility", auth(["STAGIAIRE"]), checkEligibility);
router.get("/mes-attestations", auth(["SALARIE", "STAGIAIRE"]), getMesAttestations);

// Routes pour ADMIN_RH
router.put("/generer/:id", auth(["ADMIN_RH"]), generateAttestation);
router.get("/download/:id", auth(["ADMIN_RH"]), downloadAttestation);
router.get("/historique", auth(["ADMIN_RH"]), getHistorique);
router.get("/", auth(["ADMIN_RH"]), getAllAttestations);

module.exports = router;