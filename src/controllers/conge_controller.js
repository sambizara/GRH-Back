const Conge = require("../models/conge_model");

// Créer une demande de congé
exports.createConge = async (req, res) => {
    try {
        const { typeConge, dateDebut, dateFin, motif } = req.body;

        const nouveauConge = new Conge({
            user: req.user.userId,
            typeConge,
            dateDebut,
            dateFin,
            motif
        });

        await nouveauConge.save();
        res.status(201).json({ message: "Demande de congé créée avec succès", conge: nouveauConge });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// voir mes conges (employé)
exports.getMesConges = async (req, res) => {
    try {
        const conges = await Conge.find({ user: req.user.userId }).populate('user', 'nom prenom email');
        res.status(200).json(conges);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// voir toutes les demandes de congé (ADMIN_RH)
exports.getAllConges = async (req, res) => {
    try {
        const conges = await Conge.find().populate('user', 'nom prenom email role');
        res.status(200).json(conges);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Valider ou refuser une demande de congé (ADMIN_RH)
exports.updateCongeStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['APPROUVE', 'REFUSE'].includes(status)) {
            return res.status(400).json({ message: "Statut invalide" });
        }
        const conge = await Conge.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('user', 'nom prenom email role');
        if (!conge) {
            return res.status(404).json({ message: "Demande de congé non trouvée" });
        }

        res.status(200).json({ message: "Statut de la demande de congé mis à jour", conge });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Supprimer une demande de congé (employé ou ADMIN_RH)
exports.deleteConge = async (req, res) => {
    try {
        const conge = await Conge.findById(req.params.id);
        if (!conge) {
            return res.status(404).json({ message: "Demande de congé non trouvée" });
        }
        if (conge.user.toString() !== req.user.userId && req.user.role !== 'ADMIN_RH') {
            return res.status(403).json({ message: "Accès refusé" });
        }
        await conge.remove();
        res.status(200).json({ message: "Demande de congé supprimée avec succès" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

