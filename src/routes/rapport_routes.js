const express = require('express');
const {
    deposerRapport,
    getMyRapports,
    getAllRapports,
    updateRapport
} = require('../controllers/rapport_controller');

const auth = require('../middlewares/auth_middleware');

const router = express.Router();

// Routes pour STAGIAIRE
router.post('/', auth(['STAGIAIRE']), deposerRapport);
router.get('/mes-rapports', auth(['STAGIAIRE']), getMyRapports); // Corrigé le chemin

// Routes pour ADMIN_RH
router.get('/', auth(['ADMIN_RH']), getAllRapports); // Simplifié le chemin
router.put('/:rapportId', auth(['ADMIN_RH']), updateRapport); // Corrigé le paramètre

module.exports = router;