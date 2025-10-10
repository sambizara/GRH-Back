// services/matchingService.js
const { Stagiaire, Salarie } = require('../models/user_model');
const Stage = require('../models/stage_model');
const Notification = require('../models/notification_model');

exports.autoMatchStagiaire = async (stagiaireId) => {
    try {
        console.log(`🔄 Début matching automatique pour stagiaire: ${stagiaireId}`);
        
        const stagiaire = await Stagiaire.findById(stagiaireId);
        if (!stagiaire) {
            throw new Error('Stagiaire non trouvé');
        }

        console.log(`🔍 Recherche salariés avec poste: ${stagiaire.poste}`);
        
        // Trouver les salariés avec le même poste
        const salariesCompatibles = await Salarie.find({
            poste: stagiaire.poste,
            actif: true
        });

        console.log(`✅ ${salariesCompatibles.length} salarié(s) compatible(s) trouvé(s)`);

        if (salariesCompatibles.length === 0) {
            console.log('⚠️ Aucun salarié compatible trouvé');
            return 0;
        }

        // Créer des stages "proposés" pour chaque salarié compatible
        const stagesPromises = salariesCompatibles.map(async (salarie) => {
            // Calcul des dates automatiques
            const dateDebut = new Date();
            const dateFin = new Date(dateDebut);
            dateFin.setMonth(dateFin.getMonth() + stagiaire.dureeStage);

            const stage = new Stage({
                stagiaire: stagiaireId,
                encadreur: salarie._id,
                sujet: `Stage ${stagiaire.poste} - ${stagiaire.filiere}`,
                dateDebut: dateDebut,
                dateFin: dateFin,
                statut: 'Proposé',
                confirmationEncadreur: {
                    statut: 'en_attente'
                }
            });

            await stage.save();

            // Notification au salarié
            const notification = new Notification({
                user: salarie._id,
                type: 'Nouveau stagiaire proposé',
                message: `Un nouveau stagiaire (${stagiaire.prenom} ${stagiaire.nom}) a été proposé pour votre équipe. Poste: ${stagiaire.poste}, École: ${stagiaire.ecole}, Durée: ${stagiaire.dureeStage} mois`,
                lien: `/salarie/gestion-stagiaires`
            });
            await notification.save();

            console.log(`📧 Notification envoyée à ${salarie.prenom} ${salarie.nom}`);

            return stage;
        });

        await Promise.all(stagesPromises);
        
        console.log(`🎯 ${salariesCompatibles.length} stage(s) proposé(s) créé(s)`);
        return salariesCompatibles.length;

    } catch (error) {
        console.error('❌ Erreur matching automatique:', error);
        throw error;
    }
};