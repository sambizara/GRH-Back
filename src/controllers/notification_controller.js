const Notification = require('../models/notification_model');

// Créer une notification
exports.createNotification = async (req, res) => {
    try {
        const { user, type, message } = req.body;
        const notification = new Notification({ user, type, message });
        await notification.save();
        res.status(201).json({ message: 'Notification créée avec succès', notification });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création de la notification', error });
    }
};

// Récupérer les notifications d'un utilisateur
exports.getUserNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des notifications', error });
    }
};

// Mettre à jour le statut d'une notification (lu/non lu)
exports.updateNotificationStatus = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { statut } = req.body;
        const notification = await Notification.findByIdAndUpdate(
            notificationId, { statut }, { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        res.status(200).json({ message: 'Statut de la notification mis à jour', notification });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut de la notification', error });
    }
};

// Supprimer une notification
exports.deleteNotification = async (req, res) => {
    try {
        const  notification = await Notification.findByIdAndDelete(req.params.notificationId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }
        res.status(200).json({ message: 'Notification supprimée' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de la notification', error });
    }
};