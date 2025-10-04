// routes/contrat_routes.js
const express = require('express');
const {
    createContrat,
    getContrats,
    getContratById,
    updateContrat,
    deleteContrat,
    getMesContrats,
    getContratsByService // ✅ Nouveau
} = require('../controllers/contrat_controller');

const auth = require('../middlewares/auth_middleware');

const router = express.Router();

// Routes pour ADMIN_RH
router.post('/', auth(['ADMIN_RH']), createContrat);
router.get('/', auth(['ADMIN_RH']), getContrats);
router.get('/service/:serviceId', auth(['ADMIN_RH']), getContratsByService); // ✅ Nouveau
router.get('/:id', auth(['ADMIN_RH', 'SALARIE', 'STAGIAIRE']), getContratById); // ✅ Modifié
router.put('/:id', auth(['ADMIN_RH']), updateContrat);
router.delete('/:id', auth(['ADMIN_RH']), deleteContrat);

// Routes pour les utilisateurs
router.get('/mes/contrats', auth(['SALARIE', 'STAGIAIRE']), getMesContrats);

module.exports = router;