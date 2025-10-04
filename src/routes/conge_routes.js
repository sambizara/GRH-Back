const express = require('express');
const { 
    createConge, 
    getMesConges, 
    getAllConges, 
    updateCongeStatus, 
    deleteConge,
    getMesSoldes
} = require('../controllers/conge_controller');
const auth = require('../middlewares/auth_middleware');

const router = express.Router();

// Routes SALARIE
router.post('/', auth(['SALARIE']), createConge);
router.get('/mes-conges', auth(['SALARIE']), getMesConges);
router.get('/mes-soldes', auth(['SALARIE']), getMesSoldes);

// Routes ADMIN_RH - ⭐ CORRECTION: routes séparées pour admin
router.get('/admin/tous', auth(['ADMIN_RH']), getAllConges);
router.put('/admin/:id/statut', auth(['ADMIN_RH']), updateCongeStatus); // ⭐ Changé le chemin

// Route mixte (SALARIE peut supprimer ses congés, ADMIN peut tous supprimer)
router.delete('/:id', auth(['SALARIE', 'ADMIN_RH']), deleteConge);

module.exports = router;