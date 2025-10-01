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
router.get('/rapports', auth(['STAGIAIRE']), getMyRapports);
// Routes pour ADMIN_RH
router.get('/admin/allRapports', auth(['ADMIN_RH']), getAllRapports);
router.put('/admin/:rapportId', auth(['ADMIN_RH']), updateRapport);

module.exports = router;