const express = require('express');
const {
    createNotification,
    getUserNotifications,
    updateNotificationStatus,
    deleteNotification
} = require('../controllers/notification_controller');

const auth = require('../middlewares/auth_middleware');

const router = express.Router();

// Routes pour ADMIN_RH
router.post('/', auth(['ADMIN_RH']), createNotification);

// Routes pour tous les utilisateurs authentifiés
router.get('/me', auth(['SALARIE', 'STAGIAIRE', 'ADMIN_RH']), getUserNotifications);
router.put('/:id', auth(['SALARIE', 'STAGIAIRE', 'ADMIN_RH']), updateNotificationStatus);
router.delete('/:id', auth(['ADMIN_RH']), deleteNotification);

module.exports = router;
