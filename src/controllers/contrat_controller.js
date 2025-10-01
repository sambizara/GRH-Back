const Contrat = require('../models/contrat_model');

// Ajouter un nouveau contrat (par un ADMIN_RH)
exports.createContrat = async (req, res) => {
    try {
        const { user, typeContrat, dateDebut, dateFin, statut, salaire } = req.body;
        const newContrat = new Contrat({
            user,
            typeContrat,
            dateDebut,
            dateFin,
            statut: statut || 'Actif',
            salaire
        });
        await newContrat.save();
        res.status(201).json({ message: 'Contrat créé avec succès', contrat: newContrat });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Voir tous les contrats (par un ADMIN_RH)
exports.getContrats = async (req, res) => {
    try {
        const contrats = await Contrat.find().populate('user', 'nom prenom email role service');
        res.status(200).json(contrats);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Voir un contrat par ID (par un ADMIN_RH)
exports.getContratById = async (req, res) => {
    try {
        const contrat = await Contrat.findById(req.params.id).populate('user', 'nom prenom email role service');
        if (!contrat) {
            return res.status(404).json({ message: 'Contrat non trouvé' });
        }
        res.status(200).json(contrat);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Modifier un contrat (par un ADMIN_RH)
exports.updateContrat = async (req, res) => {
    try {
        const {id} = req.params;
        const contrat = await Contrat.findByIdAndUpdate(id, req.body, { new: true });
        if (!contrat) {
            return res.status(404).json({ message: 'Contrat non trouvé' });
        }
        res.status(200).json({ message: 'Contrat mis à jour avec succès', contrat });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Supprimer un contrat (par un ADMIN_RH)
exports.deleteContrat = async (req, res) => {
    try {
        const {id} = req.params;
        const contrat = await Contrat.findByIdAndDelete(id);
        if (!contrat) {
            return res.status(404).json({ message: 'Contrat non trouvé' });
        }
        res.status(200).json({ message: 'Contrat supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Voir les contrats de l'utilisateur connecté (par un SALARIE ou STAGIAIRE)
exports.getMyContrats = async (req, res) => {
    try {
        const contrats = await Contrat.find({ user: req.user.id }).populate('user', 'nom prenom email role service');
        res.status(200).json(contrats);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};


