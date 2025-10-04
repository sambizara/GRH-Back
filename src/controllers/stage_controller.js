const Stage = require('../models/stage_model');
const User = require('../models/user_model');
const Notification = require('../models/notification_model');

// Créer un nouveau stage (SALARIE)
exports.createStage = async (req, res) => {
    try {
        const { stagiaireId, sujet, dateDebut, dateFin, statut } = req.body;

        // Vérifier si le stagiaire existe
        const stagiaire = await User.findById(stagiaireId);
        if (!stagiaire || stagiaire.role !== 'STAGIAIRE') {
            return res.status(404).json({ message: "Stagiaire non trouvé ou rôle incorrect" });
        }

        // Vérifier si un stage existe déjà pour ce stagiaire
        const stageExistant = await Stage.findOne({ stagiaire: stagiaireId });
        if (stageExistant) {
            return res.status(400).json({ message: "Ce stagiaire a déjà un stage" });
        }

        // Créer le nouveau stage
        const nouveauStage = new Stage({
            stagiaire: stagiaireId,
            sujet,
            dateDebut,
            dateFin,
            statut
            // encadreur sera null au début
        });

        await nouveauStage.save();

        // Mettre à jour le stagiaire avec la référence du stage
        stagiaire.stage = nouveauStage._id;
        await stagiaire.save();

        // Populer les données pour la réponse
        const stagePopule = await Stage.findById(nouveauStage._id)
            .populate('stagiaire', 'nom prenom email role')
            .populate('encadreur', 'nom prenom email role');

        res.status(201).json({ 
            message: 'Stage créé avec succès', 
            stage: stagePopule 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Erreur lors de la création du stage', 
            error: error.message 
        });
    }
};

// Assigner un encadreur à un stage (ADMIN_RH)
exports.assignerEncadreur = async (req, res) => {
    try {
        const { stageId, encadreurId } = req.body;

        const stage = await Stage.findById(stageId);
        if (!stage) {
            return res.status(404).json({ message: "Stage non trouvé" });
        }

        const encadreur = await User.findById(encadreurId);
        if (!encadreur) {
            return res.status(404).json({ message: "Encadreur non trouvé" });
        }

        // Assigner l'encadreur au stage
        stage.encadreur = encadreurId;
        await stage.save();

        const stagePopule = await Stage.findById(stageId)
            .populate('stagiaire', 'nom prenom email role')
            .populate('encadreur', 'nom prenom email role');

        res.status(200).json({ 
            message: 'Encadreur assigné avec succès', 
            stage: stagePopule 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Erreur lors de l'assignation de l'encadreur", 
            error: error.message 
        });
    }
};

// Lister tous les stages
exports.getAllStages = async (req, res) => {
    try {
        const stages = await Stage.find()
            .populate('stagiaire', 'nom prenom email role')
            .populate('encadreur', 'nom prenom email role');
        res.status(200).json(stages);
    } catch (error) {
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des stages', 
            error: error.message 
        });
    }
};

// Obtenir un stage par ID
exports.getStageById = async (req, res) => {
    try {
        const stage = await Stage.findById(req.params.id)
            .populate('stagiaire', 'nom prenom email role')
            .populate('encadreur', 'nom prenom email role');
        if (!stage) {
            return res.status(404).json({ message: 'Stage non trouvé' });
        }
        res.status(200).json(stage);
    } catch (error) {
        res.status(500).json({ 
            message: 'Erreur lors de la récupération du stage', 
            error: error.message 
        });
    }
};

// Mettre à jour le statut d'un stage
exports.updateStageStatus = async (req, res) => {
    try {
        const { statut } = req.body;
        const stage = await Stage.findByIdAndUpdate(
            req.params.id,
            { statut },
            { new: true }
        ).populate('stagiaire', 'nom prenom email role')
         .populate('encadreur', 'nom prenom email role');

        if (!stage) {
            return res.status(404).json({ message: 'Stage non trouvé' });
        }
        res.status(200).json({ 
            message: 'Statut du stage mis à jour avec succès', 
            stage 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Erreur lors de la mise à jour du stage', 
            error: error.message 
        });
    }
};

// Supprimer un stage
exports.deleteStage = async (req, res) => {
    try {
        const stage = await Stage.findByIdAndDelete(req.params.id);
        if (!stage) {
            return res.status(404).json({ message: 'Stage non trouvé' });
        }

        // Retirer la référence du stage chez le stagiaire
        await User.findByIdAndUpdate(stage.stagiaire, { $unset: { stage: 1 } });

        res.status(200).json({ message: 'Stage supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Erreur lors de la suppression du stage', 
            error: error.message 
        });
    }
};

// Notifier un utilisateur
exports.notifyUser = async (req, res) => {
    try {
        const { userId, type, message } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        const notification = new Notification({ user: userId, type, message });
        await notification.save();
        res.status(201).json({ 
            message: 'Notification envoyée avec succès', 
            notification 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Erreur lors de l'envoi de la notification", 
            error: error.message 
        });
    }
};

// Récupérer les stages sans encadreur (pour ADMIN_RH)
exports.getStagesSansEncadreur = async (req, res) => {
    try {
        const stages = await Stage.find({ encadreur: null })
            .populate('stagiaire', 'nom prenom email role');
        res.status(200).json(stages);
    } catch (error) {
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des stages sans encadreur', 
            error: error.message 
        });
    }
};