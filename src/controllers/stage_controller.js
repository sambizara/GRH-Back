const Stage = require('../models/stage_model');
const User = require('../models/user_model');
const Notification = require('../models/notification_model');

// Assigner un encadreur à un stagiaire
exports.assignerEncadreur = async (req, res) => {
    try {
        const { stagiaireId, encadreurId } = req.body;
        const stagiaire = await User.findById(stagiaireId);
        if (!stagiaire || stagiaire.role !== 'STAGIAIRE') {
            return res.status(404).json({ message: "Utilisateur fourni n'est pas un stagiaire validé ou rôle incorrect" });
        }

        const encadreur = await User.findById(encadreurId);
        if (!encadreur || encadreur.role !== 'ENCADREUR') {
            return res.status(404).json({ message: "Utilisateur fourni n'est pas un encadreur ou rôle incorrect" });
        }

        const stage = await Stage.findByIdAndUpdate(
            stagiaire.stage, { encadreur: encadreurId }, { new: true }
        ).populate('stagiaire', 'name prenom email role')
         .populate('encadreur', 'name prenom email role');

        if (!stage) {
            return res.status(404).json({ message: 'Stage non trouvé pour ce stagiaire' });
        }

        res.status(200).json({ message: 'Encadreur assigné avec succès', stage });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'assignation de l'encadreur", error });
    }
};

// Lister tous les stages (admin)
exports.getAllStages = async (req, res) => {
    try {
        const stages = await Stage.find()
            .populate('stagiaire', 'name prenom email role')
            .populate('encadreur', 'name prenom email role');
        res.status(200).json(stages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des stages', error });
    }
};

// obtenir un stage par ID
exports.getStageById = async (req, res) => {
    try {
        const stage = await Stage.findById(req.params.stageId)
            .populate('stagiaire', 'name prenom email role')
            .populate('encadreur', 'name prenom email role');
        if (!stage) {
            return res.status(404).json({ message: 'Stage non trouvé' });
        }
        res.status(200).json(stage);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération du stage', error });
    }
};

// Mettre à jour le statut d'un stage (par encadreur ou admin)
exports.updateStageStatus = async (req, res) => {
    try {
        const { sujet, dateDebut, dateFin, statut } = req.body;
        const stage = await Stage.findByIdAndUpdate(
            req.params.stageId,
            { sujet, dateDebut, dateFin, statut },
            { new: true }
        ).populate('stagiaire', 'name prenom email role')
         .populate('encadreur', 'name prenom email role');

        if (!stage) {
            return res.status(404).json({ message: 'Stage non trouvé' });
        }
        res.status(200).json({ message: 'Stage mis à jour avec succès', stage });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du stage', error });
    }
};

// Supprimer un stage (admin)
exports.deleteStage = async (req, res) => {
    try {
        const stage = await Stage.findByIdAndDelete(req.params.stageId);
        if (!stage) {
            return res.status(404).json({ message: 'Stage non trouvé' });
        }
        res.status(200).json({ message: 'Stage supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du stage', error });
    }
};

// Notifier un utilisateur (stagiaire ou encadreur)
exports.notifyUser = async (req, res) => {
    try {
        const { userId, type, message } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        const notification = new Notification({ user: userId, type, message });
        await notification.save();
        res.status(201).json({ message: 'Notification envoyée avec succès', notification });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'envoi de la notification", error });
    }
};


