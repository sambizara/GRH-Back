const Notification = require('../models/notification_model');

// Créer une notification
exports.createNotification = async (req, res) => {
    try {
        const { user, type, category, title, message, relatedEntity, entityModel, priority } = req.body;
        const notification = await Notification.create({ 
            user, type, category, title, message, relatedEntity, entityModel, priority 
        });
        await notification.populate('user', 'nom prenom email role');
        res.status(201).json({ success: true, message: 'Notification créée', notification });
    } catch (error) {
        console.error('Erreur création notification:', error);
        res.status(500).json({ success: false, message: 'Erreur création notification', error: error.message });
    }
};

// Récupérer notifications utilisateur
exports.getUserNotifications = async (req, res) => {
    try {
        const { statut, category, limit = 20, page = 1 } = req.query;
        const filter = { user: req.user._id };
        if (statut) filter.statut = statut;
        if (category) filter.category = category;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'nom prenom email role');

        const unreadCount = await Notification.countDocuments({ user: req.user._id, statut: 'Non lu' });

        res.status(200).json({ success: true, notifications, unreadCount, total: notifications.length });
    } catch (error) {
        console.error('Erreur récupération notifications:', error);
        res.status(500).json({ success: false, message: 'Erreur récupération notifications', error: error.message });
    }
};

// Compteurs par catégorie
exports.getNotificationCounts = async (req, res) => {
    try {
        const counts = await Notification.aggregate([
            { $match: { user: req.user._id, statut: 'Non lu' } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const formattedCounts = {
            CONGE: 0, STAGE: 0, ATTESTATION: 0, RAPPORT: 0, UTILISATEUR: 0, CONTRAT: 0, AUTRE: 0, total: 0
        };
        counts.forEach(c => {
            formattedCounts[c._id] = c.count;
            formattedCounts.total += c.count;
        });

        res.status(200).json({ success: true, counts: formattedCounts });
    } catch (error) {
        console.error('Erreur compteurs notifications:', error);
        res.status(500).json({ success: false, message: 'Erreur calcul compteurs', error: error.message });
    }
};

// Marquer notification comme lue
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findByIdAndUpdate(notificationId, { statut: 'Lu' }, { new: true })
            .populate('user', 'nom prenom email role');
        if (!notification) return res.status(404).json({ success: false, message: 'Notification non trouvée' });
        res.status(200).json({ success: true, message: 'Notification marquée comme lue', notification });
    } catch (error) {
        console.error('Erreur marquage notification:', error);
        res.status(500).json({ success: false, message: 'Erreur marquage notification', error: error.message });
    }
};

// Marquer toutes comme lues
exports.markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany({ user: req.user._id, statut: 'Non lu' }, { statut: 'Lu' });
        res.status(200).json({ success: true, message: `${result.modifiedCount} notifications marquées comme lues`, modifiedCount: result.modifiedCount });
    } catch (error) {
        console.error('Erreur marquage multiple:', error);
        res.status(500).json({ success: false, message: 'Erreur marquage multiple', error: error.message });
    }
};

// Mettre à jour statut
exports.updateNotificationStatus = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { statut } = req.body;
        if (!['Non lu', 'Lu'].includes(statut)) return res.status(400).json({ success: false, message: 'Statut invalide' });

        const notification = await Notification.findByIdAndUpdate(notificationId, { statut }, { new: true }).populate('user', 'nom prenom email role');
        if (!notification) return res.status(404).json({ success: false, message: 'Notification non trouvée' });

        res.status(200).json({ success: true, message: 'Statut mis à jour', notification });
    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({ success: false, message: 'Erreur mise à jour statut', error: error.message });
    }
};

// Supprimer notification
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await Notification.findByIdAndDelete(notificationId);
        if (!notification) return res.status(404).json({ success: false, message: 'Notification non trouvée' });
        res.status(200).json({ success: true, message: 'Notification supprimée' });
    } catch (error) {
        console.error('Erreur suppression notification:', error);
        res.status(500).json({ success: false, message: 'Erreur suppression notification', error: error.message });
    }
};

// Supprimer toutes notifications utilisateur
exports.deleteAllUserNotifications = async (req, res) => {
    try {
        const result = await Notification.deleteMany({ user: req.user._id });
        res.status(200).json({ success: true, message: `${result.deletedCount} notifications supprimées`, deletedCount: result.deletedCount });
    } catch (error) {
        console.error('Erreur suppression multiple:', error);
        res.status(500).json({ success: false, message: 'Erreur suppression multiple', error: error.message });
    }
};

// === Service helper pour les notifications ===
exports.notificationService = {
    createNotification: async ({ userId, type, category, title, message, relatedEntity = null, entityModel = null, priority = 'MEDIUM' }) => {
        try {
            const notification = await Notification.create({
                user: userId,
                type,
                category,
                title,
                message,
                relatedEntity,
                entityModel,
                priority
            });
            return notification;
        } catch (error) {
            console.error('Erreur création notification service:', error);
            throw error;
        }
    },
    createRapportNotification: async (userId, title, message, rapportId = null) =>
        exports.notificationService.createNotification({ userId, type: 'REMINDER', category: 'RAPPORT', title, message, relatedEntity: rapportId, entityModel: 'Rapport', priority: 'MEDIUM' }),
    createAttestationNotification: async (userId, title, message, attestationId = null) =>
        exports.notificationService.createNotification({ userId, type: 'INFO', category: 'ATTESTATION', title, message, relatedEntity: attestationId, entityModel: 'Attestation', priority: 'MEDIUM' }),
    createStageNotification: async (userId, title, message, stageId = null) =>
        exports.notificationService.createNotification({ userId, type: 'ALERT', category: 'STAGE', title, message, relatedEntity: stageId, entityModel: 'Stage', priority: 'HIGH' }),
    createCongeNotification: async (userId, title, message, congeId = null) =>
        exports.notificationService.createNotification({ userId, type: 'ALERT', category: 'CONGE', title, message, relatedEntity: congeId, entityModel: 'Conge', priority: 'HIGH' })
};
