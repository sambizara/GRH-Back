// controllers/demandeStage_controller.js
const Stage = require('../models/stage_model');
const User = require('../models/user_model');
const Notification = require('../models/notification_model');

// 🔹 Confirmer un stagiaire (par l'encadreur)
exports.confirmerStagiaire = async (req, res) => {
    try {
        const { stageId } = req.params;
        const { theme, competencesRequises, objectifs, commentaires } = req.body;

        console.log("🎯 Données reçues pour confirmation:");
        console.log("- Stage ID:", stageId);
        console.log("- Body:", req.body);
        console.log("- Theme:", theme);
        console.log("- Competences:", competencesRequises);
        console.log("- Objectifs:", objectifs);
        console.log("- Commentaires:", commentaires);

        // Vérifier que l'utilisateur est un salarié
        if (req.user.role !== 'SALARIE') {
            return res.status(403).json({
                success: false,
                message: "Accès réservé aux salariés"
            });
        }

        // Validation des données requises
        if (!theme) {
            return res.status(400).json({
                success: false,
                message: "Le thème du stage est obligatoire"
            });
        }

        if (!objectifs || !Array.isArray(objectifs) || objectifs.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Les objectifs du stage sont obligatoires et doivent être un tableau non vide"
            });
        }

        const stage = await Stage.findById(stageId)
            .populate('stagiaire', 'nom prenom email')
            .populate('encadreur', 'nom prenom email');

        if (!stage) {
            return res.status(404).json({
                success: false,
                message: "Stage non trouvé"
            });
        }

        // Vérifier que l'utilisateur est bien l'encadreur de ce stage
        if (stage.encadreur._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Vous n'êtes pas l'encadreur de ce stage"
            });
        }

        // Vérifier que le stage est en attente de confirmation
        if (stage.confirmationEncadreur.statut !== 'en_attente') {
            return res.status(400).json({
                success: false,
                message: "Ce stage a déjà été traité"
            });
        }

        // Mettre à jour le stage
        stage.confirmationEncadreur.statut = 'confirmé';
        stage.confirmationEncadreur.dateConfirmation = new Date();
        stage.confirmationEncadreur.commentaires = commentaires || "Stage confirmé par l'encadreur";
        stage.statut = 'Confirmé';
        
        // Ajouter les informations supplémentaires
        stage.sujet = theme;
        if (competencesRequises) stage.competencesRequises = competencesRequises;
        stage.objectifs = objectifs;

        await stage.save();

        // Mettre à jour le statut du stagiaire dans User
        await User.findByIdAndUpdate(stage.stagiaire._id, {
            statutConfirmation: 'confirmé',
            dateConfirmation: new Date()
        });

        // Notification au stagiaire
        const notificationStagiaire = new Notification({
            user: stage.stagiaire._id,
            type: 'Stage confirmé',
            message: `Votre stage a été confirmé par ${stage.encadreur.prenom} ${stage.encadreur.nom}. Thème: ${theme}`
        });
        await notificationStagiaire.save();

        console.log(`✅ Stage ${stageId} confirmé avec succès`);

        res.status(200).json({
            success: true,
            message: "Stagiaire confirmé avec succès",
            stage: {
                _id: stage._id,
                stagiaire: stage.stagiaire,
                encadreur: stage.encadreur,
                sujet: stage.sujet,
                statut: stage.statut,
                confirmationEncadreur: stage.confirmationEncadreur
            }
        });

    } catch (error) {
        console.error("❌ Erreur confirmation stagiaire:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la confirmation du stagiaire",
            error: error.message
        });
    }
};

// 🔹 Rejeter un stagiaire (par l'encadreur)
exports.rejeterStagiaire = async (req, res) => {
    try {
        const { stageId } = req.params;
        const { motifRejet, commentaires } = req.body;

        console.log("🗑️ Données reçues pour rejet:");
        console.log("- Stage ID:", stageId);
        console.log("- Motif:", motifRejet);
        console.log("- Commentaires:", commentaires);

        if (!motifRejet) {
            return res.status(400).json({
                success: false,
                message: "Le motif du rejet est obligatoire"
            });
        }

        // Vérifier que l'utilisateur est un salarié
        if (req.user.role !== 'SALARIE') {
            return res.status(403).json({
                success: false,
                message: "Accès réservé aux salariés"
            });
        }

        const stage = await Stage.findById(stageId)
            .populate('stagiaire', 'nom prenom email')
            .populate('encadreur', 'nom prenom email');

        if (!stage) {
            return res.status(404).json({
                success: false,
                message: "Stage non trouvé"
            });
        }

        // Vérifier que l'utilisateur est bien l'encadreur de ce stage
        if (stage.encadreur._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Vous n'êtes pas l'encadreur de ce stage"
            });
        }

        // Vérifier que le stage est en attente de confirmation
        if (stage.confirmationEncadreur.statut !== 'en_attente') {
            return res.status(400).json({
                success: false,
                message: "Ce stage a déjà été traité"
            });
        }

        // Mettre à jour le stage
        stage.confirmationEncadreur.statut = 'rejeté';
        stage.confirmationEncadreur.dateConfirmation = new Date();
        stage.confirmationEncadreur.motifRejet = motifRejet;
        stage.confirmationEncadreur.commentaires = commentaires;
        stage.statut = 'Rejeté';

        await stage.save();

        // Mettre à jour le statut du stagiaire dans User
        await User.findByIdAndUpdate(stage.stagiaire._id, {
            statutConfirmation: 'rejeté',
            dateConfirmation: new Date(),
            motifRejet: motifRejet
        });

        // Notification au stagiaire
        const notificationStagiaire = new Notification({
            user: stage.stagiaire._id,
            type: 'Stage rejeté',
            message: `Votre stage a été rejeté par ${stage.encadreur.prenom} ${stage.encadreur.nom}. Motif: ${motifRejet}`
        });
        await notificationStagiaire.save();

        // Notification à l'admin RH
        const adminRH = await User.findOne({ role: 'ADMIN_RH' });
        if (adminRH) {
            const notificationAdmin = new Notification({
                user: adminRH._id,
                type: 'Stage rejeté',
                message: `Le stage de ${stage.stagiaire.prenom} ${stage.stagiaire.nom} a été rejeté par ${stage.encadreur.prenom} ${stage.encadreur.nom}. Motif: ${motifRejet}`
            });
            await notificationAdmin.save();
        }

        console.log(`✅ Stage ${stageId} rejeté avec succès`);

        res.status(200).json({
            success: true,
            message: "Stagiaire rejeté avec succès",
            stage: {
                _id: stage._id,
                stagiaire: stage.stagiaire,
                encadreur: stage.encadreur,
                statut: stage.statut,
                confirmationEncadreur: stage.confirmationEncadreur
            }
        });

    } catch (error) {
        console.error("❌ Erreur rejet stagiaire:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors du rejet du stagiaire",
            error: error.message
        });
    }
};

// 🔹 Récupérer les stagiaires en attente de confirmation
exports.getStagiairesEnAttente = async (req, res) => {
    try {
        // Vérifier que l'utilisateur est un salarié
        if (req.user.role !== 'SALARIE') {
            return res.status(403).json({
                success: false,
                message: "Accès réservé aux salariés"
            });
        }

        const stages = await Stage.find({
            encadreur: req.user.id,
            'confirmationEncadreur.statut': 'en_attente',
            statut: 'En attente'
        })
        .populate('stagiaire', 'nom prenom email ecole filiere niveau telephone poste dureeStage')
        .sort({ createdAt: -1 });

        console.log(`📋 ${stages.length} stages en attente pour l'encadreur ${req.user.id}`);

        res.status(200).json({
            success: true,
            count: stages.length,
            stages
        });

    } catch (error) {
        console.error("❌ Erreur récupération stagiaires en attente:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des stagiaires en attente",
            error: error.message
        });
    }
};

// 🔹 Récupérer l'historique des confirmations/rejets
exports.getHistoriqueConfirmations = async (req, res) => {
    try {
        // Vérifier que l'utilisateur est un salarié
        if (req.user.role !== 'SALARIE') {
            return res.status(403).json({
                success: false,
                message: "Accès réservé aux salariés"
            });
        }

        const stages = await Stage.find({
            encadreur: req.user.id,
            'confirmationEncadreur.statut': { $in: ['confirmé', 'rejeté'] }
        })
        .populate('stagiaire', 'nom prenom email ecole filiere niveau')
        .sort({ 'confirmationEncadreur.dateConfirmation': -1 });

        res.status(200).json({
            success: true,
            count: stages.length,
            stages
        });

    } catch (error) {
        console.error("❌ Erreur récupération historique:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération de l'historique",
            error: error.message
        });
    }
};

// 🔹 Récupérer les stagiaires encadrés par un salarié (stages confirmés)
exports.getMesStagiaires = async (req, res) => {
    try {
        // Vérifier que l'utilisateur est un salarié
        if (req.user.role !== 'SALARIE') {
            return res.status(403).json({
                success: false,
                message: "Accès réservé aux salariés"
            });
        }

        const stages = await Stage.find({
            encadreur: req.user.id,
            'confirmationEncadreur.statut': 'confirmé',
            statut: 'Confirmé'
        })
        .populate('stagiaire', 'nom prenom email ecole filiere niveau telephone poste dureeStage')
        .sort({ 'confirmationEncadreur.dateConfirmation': -1 });

        console.log(`👥 ${stages.length} stagiaires confirmés pour l'encadreur ${req.user.id}`);

        res.status(200).json({
            success: true,
            count: stages.length,
            stages: stages.map(stage => ({
                ...stage.toObject(),
                stagiaire: stage.stagiaire,
                dateConfirmation: stage.confirmationEncadreur.dateConfirmation
            }))
        });

    } catch (error) {
        console.error("❌ Erreur récupération des stagiaires encadrés:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des stagiaires encadrés",
            error: error.message
        });
    }
};