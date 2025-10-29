// routes/contrat_routes.js - AVEC ROUTES DE RENOUVELLEMENT
const express = require("express");
const {
    createContrat,
    getContrats,
    getContratById,
    getMesContrats,
    updateContrat,
    deleteContrat,
    getContratsByService,
    renouvelerContrat,
    verifierRenouvellement,
    getHistoriqueRenouvellements,
    getContratsEligiblesRenouvellement
} = require("../controllers/contrat_controller");

// Import des contrôleurs de notification
const {
    getExpiringContrats,
    getExpirationStats,
    checkAndCreateNotifications,
    createAdminNotification
} = require("../controllers/contrat_notification_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// Routes pour ADMIN_RH
router.post("/", auth(["ADMIN_RH"]), createContrat);
router.get("/", auth(["ADMIN_RH"]), getContrats);
router.get("/service/:serviceId", auth(["ADMIN_RH"]), getContratsByService);
router.put("/:id", auth(["ADMIN_RH"]), updateContrat);
router.delete("/:id", auth(["ADMIN_RH"]), deleteContrat);

// Routes pour les notifications d'expiration
router.get("/notifications/expiring-contrats", auth(["ADMIN_RH"]), getExpiringContrats);
router.get("/notifications/expiration-stats", auth(["ADMIN_RH"]), getExpirationStats);
router.post("/notifications/check-notifications", auth(["ADMIN_RH"]), checkAndCreateNotifications);
router.post("/notifications/admin-notification", auth(["ADMIN_RH"]), createAdminNotification);

// ROUTES : Renouvellement des contrats
router.post("/:contratId/renouveler", auth(["ADMIN_RH"]), renouvelerContrat);
router.get("/:contratId/verifier-renouvellement", auth(["ADMIN_RH"]), verifierRenouvellement);
router.get("/:contratId/historique-renouvellements", auth(["ADMIN_RH"]), getHistoriqueRenouvellements);
router.get("/renouvellement/eligibles", auth(["ADMIN_RH"]), getContratsEligiblesRenouvellement);

// Routes accessibles par tous les utilisateurs authentifiés
router.get("/:id", auth(["ADMIN_RH", "SALARIE"]), getContratById);

//  Route pour l'utilisateur connecté
router.get("/mes/contrats", auth(["SALARIE"]), getMesContrats);

module.exports = router;