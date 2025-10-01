const express = require("express");
const {
    pointerArrivee,
    pointerDepart,
    getHistoriquePersonnel,
    getAllPresences,
    marquerAbsence
} = require("../controllers/presence_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();


// Routes pour Salarié et Stagiaire
router.post("/arrivee", auth(["SALARIE", "STAGIAIRE"]), pointerArrivee);
router.post("/depart", auth(["SALARIE", "STAGIAIRE"]), pointerDepart);
router.get("/historique", auth(["SALARIE", "STAGIAIRE"]), getHistoriquePersonnel);

// Route pour ADMIN_RH
router.get("/admin/allPresences", auth(["ADMIN_RH"]), getAllPresences);
router.post("/admin/marquerAbsence", auth(["ADMIN_RH"]), marquerAbsence);

module.exports = router;