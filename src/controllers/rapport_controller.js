const Rapport = require('../models/rapport_model');

// Déposer un rapport
exports.deposerRapport = async (req, res) => {
    try {
        const { titre, fichier } = req.body;
        const rapport = new Rapport({
            user: req.user.userId,
            titre,
            fichier
        });
        await rapport.save();
        res.status(201).json({ message: 'Rapport déposé avec succès', rapport });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors du dépôt du rapport', error });
    }
};

// Voir mes rapports
exports.getMyRapports = async (req, res) => {
    try {
        const rapports = await Rapport.find({ user: req.user.userId }); // Corrigé de _id à userId
        res.status(200).json(rapports);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des rapports', error });
    }
};

// Voir tous les rapports (admin)
exports.getAllRapports = async (req, res) => {
    try {
        const rapports = await Rapport.find().populate({
            path: 'user',
            select: 'nom prenom email role service poste',
            populate: {
                path: 'service',
                select: 'nomService'
            }
        });
        res.status(200).json(rapports);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des rapports', error });
    }
};

// Valider ou rejeter un rapport (admin)
exports.updateRapport = async (req, res) => {
    try {
        const { rapportId } = req.params;
        const { statut } = req.body;

        // Vérifier que le statut est valide
        if (!['Brouillon', 'Publié', 'Archivé'].includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const rapport = await Rapport.findByIdAndUpdate(
            rapportId, 
            { statut }, 
            { new: true }
        ).populate({
            path: 'user',
            select: 'nom prenom email role service poste',
            populate: {
                path: 'service',
                select: 'nomService'
            }
        });

        if (!rapport) {
            return res.status(404).json({ message: 'Rapport non trouvé' });
        }
        res.status(200).json({ message: 'Statut du rapport mis à jour', rapport });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut du rapport', error });
    }
};