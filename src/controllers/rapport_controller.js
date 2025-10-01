const Rapport = require('../models/rapport_model');

// Deposer un rapport
exports.deposerRapport = async (req, res) => {
    try {
        const { titre, fichier } = req.body;
        const rapport = new Rapport({
            user: req.user._id,
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
        const rapports = await Rapport.find({ user: req.user._id });
        res.status(200).json(rapports);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des rapports', error });
    }
};

// Voir tous les rapports (admin)
exports.getAllRapports = async (req, res) => {
    try {
        const rapports = await Rapport.find().populate('user', 'name prenom email role');
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

        const rapport = await Rapport.findByIdAndUpdate(
            rapportId, { statut }, { new: true }
        ).populate('user', 'name prenom email role');

        if (!rapport) {
            return res.status(404).json({ message: 'Rapport non trouvé' });
        }
        res.status(200).json({ message: 'Statut du rapport mis à jour', rapport });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut du rapport', error });
    }
};
