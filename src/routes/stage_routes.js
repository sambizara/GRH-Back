// routes/stage_routes.js
const express = require("express");
const {
    createStage,
    assignerEncadreur,
    getAllStages,
    getStageById,
    updateStageStatus,
    updateStage,
    deleteStage,
    notifyUser,
    getStagesSansEncadreur,
    getMonStage,
    getStagesEncadres,
    getStagesProposes,
    confirmerStagePropose,
    rejeterStagePropose
} = require("../controllers/stage_controller");

const auth = require("../middlewares/auth_middleware");

const router = express.Router();

// 🔹 ADMIN_RH : Créer un stage
router.post("/", auth(["ADMIN_RH"]), createStage);

// 🔹 ADMIN_RH : Assigner/Mettre à jour un encadreur
router.post("/assigner-encadreur", auth(["ADMIN_RH"]), assignerEncadreur);

// 🔹 ADMIN_RH : Récupérer les stages sans encadreur
router.get("/sans-encadreur", auth(["ADMIN_RH"]), getStagesSansEncadreur);

// 🔹 SALARIE : Récupérer mes stages encadrés
router.get("/mes-stages-encadres", auth(["SALARIE"]), getStagesEncadres);

// 🔹 STAGIAIRE : Récupérer mon stage actuel
router.get("/mon-stage", auth(["STAGIAIRE"]), getMonStage);

// 🔹 ADMIN_RH, SALARIE : Voir tous les stages (avec filtres optionnels)
router.get("/", auth(["ADMIN_RH", "SALARIE"]), getAllStages);

// 🔹 ADMIN_RH, SALARIE, STAGIAIRE : Voir un stage spécifique
router.get("/:id", auth(["ADMIN_RH", "SALARIE", "STAGIAIRE"]), getStageById);

// 🔹 ADMIN_RH : Mettre à jour un stage (informations générales)
router.put("/:id", auth(["ADMIN_RH"]), updateStage);

// 🔹 ADMIN_RH : Mettre à jour le statut d'un stage
router.patch("/:id/statut", auth(["ADMIN_RH"]), updateStageStatus);

// 🔹 ADMIN_RH : Supprimer un stage
router.delete("/:id", auth(["ADMIN_RH"]), deleteStage);

// 🔹 ADMIN_RH : Envoyer une notification (fonction utilitaire)
router.post("/notifier", auth(["ADMIN_RH"]), notifyUser);

// ✅ NOUVELLES ROUTES POUR LE SYSTÈME AUTOMATIQUE
router.get("/mes-stages-proposes", auth(["SALARIE"]), getStagesProposes);
router.post("/:id/confirmer-propose", auth(["SALARIE"]), confirmerStagePropose);
router.post("/:id/rejeter-propose", auth(["SALARIE"]), rejeterStagePropose);

module.exports = router;