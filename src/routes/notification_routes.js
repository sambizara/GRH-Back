const express = require('express');
const {
    createNotification,
    getUserNotifications,
    getNotificationCounts,
    markAsRead,
    markAllAsRead,
    updateNotificationStatus,
    deleteNotification,
    deleteAllUserNotifications,
    notificationService
} = require('../controllers/notification_controller');

const auth = require('../middlewares/auth_middleware');

const router = express.Router();

// ADMIN_RH peut créer notification manuelle
router.post('/', auth(['ADMIN_RH']), createNotification);

// Utilisateurs authentifiés
router.get('/me', auth(['SALARIE', 'STAGIAIRE', 'ADMIN_RH']), getUserNotifications);
router.get('/counts', auth(['SALARIE', 'STAGIAIRE', 'ADMIN_RH']), getNotificationCounts);
router.put('/:notificationId/mark-read', auth(['SALARIE', 'STAGIAIRE', 'ADMIN_RH']), markAsRead);
router.put('/mark-all-read', auth(['SALARIE', 'STAGIAIRE', 'ADMIN_RH']), markAllAsRead);
router.put('/:notificationId/status', auth(['SALARIE', 'STAGIAIRE', 'ADMIN_RH']), updateNotificationStatus);
router.delete('/:notificationId', auth(['SALARIE', 'STAGIAIRE', 'ADMIN_RH']), deleteNotification);
router.delete('/', auth(['SALARIE', 'STAGIAIRE', 'ADMIN_RH']), deleteAllUserNotifications);

module.exports = router;
module.exports.notificationService = notificationService;
