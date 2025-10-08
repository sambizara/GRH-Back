// routes/contrat_routes.js
const express = require("express");
const {
    createContrat,
    getContrats,
    getContratById,
    getMesContrats,
    updateContrat,
    deleteContrat,
    getContratsByService
} = require("../controllers/contrat_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// Routes pour ADMIN_RH
router.post("/", auth(["ADMIN_RH"]), createContrat);
router.get("/", auth(["ADMIN_RH"]), getContrats);
router.get("/service/:serviceId", auth(["ADMIN_RH"]), getContratsByService);
router.put("/:id", auth(["ADMIN_RH"]), updateContrat);
router.delete("/:id", auth(["ADMIN_RH"]), deleteContrat);

// Routes accessibles par tous les utilisateurs authentifiés
router.get("/:id", auth(["ADMIN_RH", "SALARIE"]), getContratById);

// Route pour l'utilisateur connecté
router.get("/mes-contrats/moi", auth(["SALARIE"]), getMesContrats);

module.exports = router;