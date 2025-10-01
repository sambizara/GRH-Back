const express = require("express");
const { 
    demandeSalarie, 
    previewSalarie,
    demandeStagiaire, 
    checkEligibility,  
    generateAttestation,
    downloadAttestation,
    getHistorique,
    getAllAttestations
} = require("../controllers/attestation_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// Routes pour Salarié et Stagiaire
router.post("/salarie/demande", auth(["SALARIE"]), demandeSalarie);
router.post("/salarie/preview", auth(["SALARIE"]), previewSalarie);
router.post("/stagiaire/demande", auth(["STAGIAIRE"]), demandeStagiaire);
router.get("/stagiaire/eligibility", auth(["STAGIAIRE"]), checkEligibility);

// Routes pour ADMIN_RH
router.put("/generer/:id", auth(["ADMIN_RH"]), generateAttestation);
router.get("/download/:id", auth(["ADMIN_RH"]), downloadAttestation);
router.get("/historique", auth(["ADMIN_RH"]), getHistorique);

// Route pour récupérer toutes les attestations (ADMIN_RH)
router.get("/", auth(["ADMIN_RH"]), getAllAttestations);

module.exports = router;