// controllers/stage_controller.js
const Stage = require('../models/stage_model');
const User = require('../models/user_model');
const Notification = require('../models/notification_model');

// Créer un nouveau stage (ADMIN_RH uniquement)
exports.createStage = async (req, res) => {
    try {
        const { stagiaireId, encadreurId, sujet, dateDebut, dateFin } = req.body;

        // Vérifications des données obligatoires
        if (!stagiaireId || !sujet || !dateDebut || !dateFin) {
            return res.status(400).json({ 
                success: false,
                message: "Données manquantes: stagiaireId, sujet, dateDebut et dateFin sont obligatoires" 
            });
        }

        // Vérifier si le stagiaire existe et est bien un STAGIAIRE
        const stagiaire = await User.findById(stagiaireId);
        if (!stagiaire) {
            return res.status(404).json({ 
                success: false,
                message: "Stagiaire non trouvé" 
            });
        }
        if (stagiaire.role !== 'STAGIAIRE') {
            return res.status(400).json({ 
                success: false,
                message: "L'utilisateur sélectionné n'est pas un stagiaire" 
            });
        }

        // Vérifier si l'encadreur existe et est bien un SALARIE
        let encadreur = null;
        if (encadreurId) {
            encadreur = await User.findById(encadreurId);
            if (!encadreur) {
                return res.status(404).json({ 
                    success: false,
                    message: "Encadreur non trouvé" 
                });
            }
            if (encadreur.role !== 'SALARIE') {
                return res.status(400).json({ 
                    success: false,
                    message: "L'encadreur doit être un salarié" 
                });
            }
        }

        // Vérifier si un stage actif existe déjà pour ce stagiaire
        const stageExistant = await Stage.findOne({ 
            stagiaire: stagiaireId,
            statut: { $in: ['En attente', 'En cours', 'Confirmé'] }
        });
        if (stageExistant) {
            return res.status(400).json({ 
                success: false,
                message: "Ce stagiaire a déjà un stage en cours ou en attente" 
            });
        }

        // Vérifier les dates
        if (new Date(dateDebut) >= new Date(dateFin)) {
            return res.status(400).json({ 
                success: false,
                message: "La date de fin doit être postérieure à la date de début" 
            });
        }

        // Créer le nouveau stage
        const nouveauStage = new Stage({
            stagiaire: stagiaireId,
            encadreur: encadreurId || null,
            sujet,
            dateDebut,
            dateFin,
            statut: encadreurId ? 'En attente' : 'En attente', // Toujours en attente maintenant
            confirmationEncadreur: {
                statut: encadreurId ? 'en_attente' : 'en_attente'
            }
        });

        await nouveauStage.save();

        // Populer les données pour la réponse
        const stagePopule = await Stage.findById(nouveauStage._id)
            .populate('stagiaire', 'nom prenom email role ecole filiere niveau poste dureeStage')
            .populate('encadreur', 'nom prenom email role matricule');

        // Notification si encadreur assigné
        if (encadreurId) {
            const notification = new Notification({
                user: encadreurId,
                type: 'Nouveau stagiaire à confirmer',
                message: `Un nouveau stagiaire (${stagiaire.prenom} ${stagiaire.nom}) vous a été assigné. Veuillez confirmer ou rejeter cette assignation.`
            });
            await notification.save();
        }

        res.status(201).json({ 
            success: true,
            message: 'Stage créé avec succès', 
            stage: stagePopule 
        });
    } catch (error) {
        console.error("❌ Erreur création stage:", error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la création du stage', 
            error: error.message 
        });
    }
};

// Assigner/Mettre à jour un encadreur à un stage (ADMIN_RH)
exports.assignerEncadreur = async (req, res) => {
    try {
        const { stageId, encadreurId } = req.body;

        if (!stageId || !encadreurId) {
            return res.status(400).json({ 
                success: false,
                message: "stageId et encadreurId sont obligatoires" 
            });
        }

        const stage = await Stage.findById(stageId);
        if (!stage) {
            return res.status(404).json({ 
                success: false,
                message: "Stage non trouvé" 
            });
        }

        const encadreur = await User.findById(encadreurId);
        if (!encadreur || encadreur.role !== 'SALARIE') {
            return res.status(404).json({ 
                success: false,
                message: "Encadreur non trouvé ou n'est pas un salarié" 
            });
        }

        // Vérifier si l'encadreur n'est pas déjà assigné
        if (stage.encadreur && stage.encadreur.toString() === encadreurId) {
            return res.status(400).json({ 
                success: false,
                message: "Cet encadreur est déjà assigné à ce stage" 
            });
        }

        // Mettre à jour l'encadreur et le statut
        stage.encadreur = encadreurId;
        stage.statut = 'En attente';
        stage.confirmationEncadreur.statut = 'en_attente';
        await stage.save();

        const stagePopule = await Stage.findById(stageId)
            .populate('stagiaire', 'nom prenom email role ecole filiere niveau poste dureeStage')
            .populate('encadreur', 'nom prenom email role matricule');

        // Notification au nouvel encadreur
        const notification = new Notification({
            user: encadreurId,
            type: 'Nouveau stagiaire à confirmer',
            message: `Un nouveau stagiaire (${stagePopule.stagiaire.prenom} ${stagePopule.stagiaire.nom}) vous a été assigné. Veuillez confirmer ou rejeter cette assignation.`
        });
        await notification.save();

        res.status(200).json({ 
            success: true,
            message: 'Encadreur assigné avec succès', 
            stage: stagePopule 
        });
    } catch (error) {
        console.error("❌ Erreur assignation encadreur:", error);
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de l'assignation de l'encadreur", 
            error: error.message 
        });
    }
};

// Lister tous les stages avec filtres
exports.getAllStages = async (req, res) => {
    try {
        const { statut, encadreur, stagiaire } = req.query;
        
        let filter = {};
        
        // Filtres optionnels
        if (statut) filter.statut = statut;
        if (encadreur) filter.encadreur = encadreur;
        if (stagiaire) filter.stagiaire = stagiaire;

        const stages = await Stage.find(filter)
            .populate('stagiaire', 'nom prenom email role ecole filiere niveau poste dureeStage')
            .populate('encadreur', 'nom prenom email role matricule')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: stages.length,
            stages
        });
    } catch (error) {
        console.error("❌ Erreur récupération stages:", error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la récupération des stages', 
            error: error.message 
        });
    }
};

// Obtenir un stage par ID
exports.getStageById = async (req, res) => {
    try {
        const stage = await Stage.findById(req.params.id)
            .populate('stagiaire', 'nom prenom email role ecole filiere niveau poste dureeStage telephone adresse')
            .populate('encadreur', 'nom prenom email role matricule telephone');

        if (!stage) {
            return res.status(404).json({ 
                success: false,
                message: 'Stage non trouvé' 
            });
        }

        res.status(200).json({
            success: true,
            stage
        });
    } catch (error) {
        console.error("❌ Erreur récupération stage:", error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la récupération du stage', 
            error: error.message 
        });
    }
};

// Mettre à jour le statut d'un stage
exports.updateStageStatus = async (req, res) => {
    try {
        const { statut } = req.body;
        
        const statutsAutorises = ['En attente', 'Confirmé', 'En cours', 'Terminé', 'Annulé', 'Rejeté'];
        if (!statut || !statutsAutorises.includes(statut)) {
            return res.status(400).json({ 
                success: false,
                message: `Statut invalide. Valeurs autorisées: ${statutsAutorises.join(', ')}` 
            });
        }

        const stage = await Stage.findByIdAndUpdate(
            req.params.id,
            { statut },
            { new: true, runValidators: true }
        )
        .populate('stagiaire', 'nom prenom email role')
        .populate('encadreur', 'nom prenom email role');

        if (!stage) {
            return res.status(404).json({ 
                success: false,
                message: 'Stage non trouvé' 
            });
        }

        // Notification si stage terminé
        if (statut === 'Terminé') {
            const notification = new Notification({
                user: stage.stagiaire._id,
                type: 'Stage terminé',
                message: `Votre stage "${stage.sujet}" a été marqué comme terminé`
            });
            await notification.save();
        }

        res.status(200).json({ 
            success: true,
            message: 'Statut du stage mis à jour avec succès', 
            stage 
        });
    } catch (error) {
        console.error("❌ Erreur mise à jour statut:", error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la mise à jour du stage', 
            error: error.message 
        });
    }
};

// Mettre à jour un stage (informations générales)
exports.updateStage = async (req, res) => {
    try {
        const { sujet, dateDebut, dateFin } = req.body;
        
        const updateData = {};
        if (sujet) updateData.sujet = sujet;
        if (dateDebut) updateData.dateDebut = dateDebut;
        if (dateFin) updateData.dateFin = dateFin;

        // Vérifier les dates si les deux sont fournies
        if (dateDebut && dateFin && new Date(dateDebut) >= new Date(dateFin)) {
            return res.status(400).json({ 
                success: false,
                message: "La date de fin doit être postérieure à la date de début" 
            });
        }

        const stage = await Stage.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('stagiaire', 'nom prenom email role ecole filiere niveau')
        .populate('encadreur', 'nom prenom email role matricule');

        if (!stage) {
            return res.status(404).json({ 
                success: false,
                message: 'Stage non trouvé' 
            });
        }

        res.status(200).json({ 
            success: true,
            message: 'Stage mis à jour avec succès', 
            stage 
        });
    } catch (error) {
        console.error("❌ Erreur mise à jour stage:", error);
        res.status(500).json({ 
            success: false,
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
            return res.status(404).json({ 
                success: false,
                message: 'Stage non trouvé' 
            });
        }

        res.status(200).json({ 
            success: true,
            message: 'Stage supprimé avec succès' 
        });
    } catch (error) {
        console.error("❌ Erreur suppression stage:", error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la suppression du stage', 
            error: error.message 
        });
    }
};

// Récupérer les stages sans encadreur (pour ADMIN_RH)
exports.getStagesSansEncadreur = async (req, res) => {
    try {
        const stages = await Stage.find({ 
            encadreur: null,
            statut: { $in: ['En attente', 'En cours'] }
        })
        .populate('stagiaire', 'nom prenom email role ecole filiere niveau poste dureeStage')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: stages.length,
            stages
        });
    } catch (error) {
        console.error("❌ Erreur récupération stages sans encadreur:", error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la récupération des stages sans encadreur', 
            error: error.message 
        });
    }
};

// 🔹 Récupérer UNIQUEMENT le stage du stagiaire connecté
exports.getMonStage = async (req, res) => {
    try {
        // Vérifier que l'utilisateur est bien un stagiaire
        if (req.user.role !== 'STAGIAIRE') {
            return res.status(403).json({ 
                success: false,
                message: "Accès réservé aux stagiaires" 
            });
        }

        const stage = await Stage.findOne({ stagiaire: req.user.id })
            .populate('stagiaire', 'nom prenom email role ecole filiere niveau poste dureeStage telephone adresse')
            .populate('encadreur', 'nom prenom email role matricule telephone');

        if (!stage) {
            return res.status(404).json({ 
                success: false,
                message: "Aucun stage trouvé pour votre compte" 
            });
        }

        res.status(200).json({
            success: true,
            stage
        });

    } catch (error) {
        console.error("❌ Erreur récupération stage stagiaire:", error);
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la récupération de votre stage", 
            error: error.message 
        });
    }
};

// 🔹 Récupérer les stages encadrés par un salarié
exports.getStagesEncadres = async (req, res) => {
    try {
        // Vérifier que l'utilisateur est bien un salarié
        if (req.user.role !== 'SALARIE') {
            return res.status(403).json({ 
                success: false,
                message: "Accès réservé aux salariés" 
            });
        }

        const stages = await Stage.find({ encadreur: req.user.id })
            .populate('stagiaire', 'nom prenom email role ecole filiere niveau poste dureeStage telephone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: stages.length,
            stages
        });

    } catch (error) {
        console.error("❌ Erreur récupération stages encadrés:", error);
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de la récupération des stages encadrés", 
            error: error.message 
        });
    }
};

// Notifier un utilisateur (fonction utilitaire)
exports.notifyUser = async (req, res) => {
    try {
        const { userId, type, message } = req.body;
        
        if (!userId || !type || !message) {
            return res.status(400).json({ 
                success: false,
                message: "userId, type et message sont obligatoires" 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "Utilisateur non trouvé" 
            });
        }

        const notification = new Notification({ 
            user: userId, 
            type, 
            message 
        });
        await notification.save();

        res.status(201).json({ 
            success: true,
            message: 'Notification envoyée avec succès', 
            notification 
        });
    } catch (error) {
        console.error("❌ Erreur envoi notification:", error);
        res.status(500).json({ 
            success: false,
            message: "Erreur lors de l'envoi de la notification", 
            error: error.message 
        });
    }
};

// 🔹 Récupérer les stages proposés pour un salarié
exports.getStagesProposes = async (req, res) => {
    try {
        const stages = await Stage.find({
            encadreur: req.user.id,
            statut: 'Proposé'
        })
        .populate('stagiaire', 'nom prenom email role ecole filiere niveau poste dureeStage telephone adresse')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: stages.length,
            stages
        });

    } catch (error) {
        console.error("❌ Erreur récupération stages proposés:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des stages proposés",
            error: error.message
        });
    }
};

// 🔹 Confirmer un stage proposé
exports.confirmerStagePropose = async (req, res) => {
    try {
        const { theme, competencesRequises, objectifs, commentaires } = req.body;

        const stage = await Stage.findById(req.params.id);
        if (!stage) {
            return res.status(404).json({
                success: false,
                message: "Stage non trouvé"
            });
        }

        // Vérifier que le stage appartient bien au salarié
        if (stage.encadreur.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Vous n'êtes pas autorisé à modifier ce stage"
            });
        }

        // Vérifier que le stage est bien "Proposé"
        if (stage.statut !== 'Proposé') {
            return res.status(400).json({
                success: false,
                message: "Ce stage n'est pas en statut 'Proposé'"
            });
        }

        // Mettre à jour le stage
        stage.statut = 'Confirmé';
        stage.confirmationEncadreur = {
            statut: 'confirmé',
            dateConfirmation: new Date(),
            commentaires: commentaires || ''
        };
        
        // Ajouter les informations supplémentaires
        if (theme) stage.theme = theme;
        if (competencesRequises) stage.competencesRequises = competencesRequises;
        if (objectifs) stage.objectifs = objectifs;

        await stage.save();

        const stagePopule = await Stage.findById(stage._id)
            .populate('stagiaire', 'nom prenom email role ecole filiere niveau poste dureeStage')
            .populate('encadreur', 'nom prenom email role');

        // Notification au stagiaire
        const notification = new Notification({
            user: stage.stagiaire._id,
            type: 'Stage confirmé',
            message: `Votre stage a été confirmé par ${req.user.prenom} ${req.user.nom}. Poste: ${stagePopule.stagiaire.poste}`
        });
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Stage confirmé avec succès',
            stage: stagePopule
        });

    } catch (error) {
        console.error("❌ Erreur confirmation stage:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la confirmation du stage",
            error: error.message
        });
    }
};

// 🔹 Rejeter un stage proposé
exports.rejeterStagePropose = async (req, res) => {
    try {
        const { motifRejet, commentaires } = req.body;

        if (!motifRejet) {
            return res.status(400).json({
                success: false,
                message: "Le motif de rejet est obligatoire"
            });
        }

        const stage = await Stage.findById(req.params.id);
        if (!stage) {
            return res.status(404).json({
                success: false,
                message: "Stage non trouvé"
            });
        }

        // Vérifier que le stage appartient bien au salarié
        if (stage.encadreur.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Vous n'êtes pas autorisé à modifier ce stage"
            });
        }

        // Vérifier que le stage est bien "Proposé"
        if (stage.statut !== 'Proposé') {
            return res.status(400).json({
                success: false,
                message: "Ce stage n'est pas en statut 'Proposé'"
            });
        }

        // Mettre à jour le stage
        stage.statut = 'Rejeté';
        stage.confirmationEncadreur = {
            statut: 'rejeté',
            dateConfirmation: new Date(),
            motifRejet: motifRejet,
            commentaires: commentaires || ''
        };

        await stage.save();

        // Notification à l'admin RH (optionnel)
        const notification = new Notification({
            user: stage.stagiaire._id, // Ou trouver un admin RH
            type: 'Stage rejeté',
            message: `Le stage de ${stage.stagiaire.prenom} ${stage.stagiaire.nom} a été rejeté par ${req.user.prenom} ${req.user.nom}. Motif: ${motifRejet}`
        });
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Stage rejeté avec succès'
        });

    } catch (error) {
        console.error("❌ Erreur rejet stage:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors du rejet du stage",
            error: error.message
        });
    }
};