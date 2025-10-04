const express = require("express");
const {
    createStage,
    assignerEncadreur,
    getAllStages,
    getStageById,
    updateStageStatus,
    deleteStage,
    notifyUser,
    getStagesSansEncadreur
} = require("../controllers/stage_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// SALARIE : Créer un stage
router.post("/", auth(["SALARIE"]), createStage);

// ADMIN_RH : Assigner un encadreur
router.post("/assign", auth(["ADMIN_RH"]), assignerEncadreur);

// ADMIN_RH : Récupérer les stages sans encadreur
router.get("/sans-encadreur", auth(["ADMIN_RH"]), getStagesSansEncadreur);

// ADMIN_RH et SALARIE : Voir tous les stages
router.get("/", auth(["ADMIN_RH", "SALARIE"]), getAllStages);

// ADMIN_RH, SALARIE, STAGIAIRE : Voir un stage spécifique
router.get("/:id", auth(["ADMIN_RH", "SALARIE", "STAGIAIRE"]), getStageById);

// ADMIN_RH : Mettre à jour le statut
router.put("/:id/statut", auth(["ADMIN_RH"]), updateStageStatus);

// ADMIN_RH : Supprimer un stage
router.delete("/:id", auth(["ADMIN_RH"]), deleteStage);

// ADMIN_RH : Envoyer une notification
router.post("/notify", auth(["ADMIN_RH"]), notifyUser);

module.exports = router;