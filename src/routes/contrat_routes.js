const express = require('express');
const {
    createContrat,
    getContrats,
    getContratById,
    updateContrat,
    deleteContrat,
    getMyContrats
} = require('../controllers/contrat_controller');

const auth = require('../middlewares/auth_middleware');

const router = express.Router();

// Routes pour ADMIN_RH
router.post('/', auth(['ADMIN_RH']), createContrat);
router.get('/', auth(['ADMIN_RH']), getContrats);
router.get('/:id', auth(['ADMIN_RH']), getContratById);
router.put('/:id', auth(['ADMIN_RH']), updateContrat);
router.delete('/:id', auth(['ADMIN_RH']), deleteContrat);

// Route pour SALARIE et STAGIAIRE pour voir leurs propres contrats
router.get('/me/contrats', auth(['SALARIE', 'STAGIAIRE']), getMyContrats);

module.exports = router;