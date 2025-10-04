const express = require("express");
const {
    pointerArrivee,
    pointerDepart,
    getHistoriquePersonnel,
    getAllPresences,
    marquerAbsence,
    ajouterPresenceManuelle
} = require("../controllers/presence_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// Routes pour Salarié et Stagiaire
router.post("/arrivee", auth(["SALARIE", "STAGIAIRE"]), pointerArrivee);
router.post("/depart", auth(["SALARIE", "STAGIAIRE"]), pointerDepart);
router.get("/historique", auth(["SALARIE", "STAGIAIRE"]), getHistoriquePersonnel);

// Routes pour ADMIN_RH
router.get("/", auth(["ADMIN_RH"]), getAllPresences); // Route simplifiée
router.post("/absence", auth(["ADMIN_RH"]), marquerAbsence);
router.post("/presence", auth(["ADMIN_RH"]), ajouterPresenceManuelle); // Nouvelle route

module.exports = router;