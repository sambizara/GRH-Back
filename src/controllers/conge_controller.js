const Conge = require("../models/conge_model");
const SoldeConge = require("../models/soldeConge_model");

// Créer une demande de congé
exports.createConge = async (req, res) => {
    try {
        const { typeConge, dateDebut, dateFin, motif } = req.body;

        if (new Date(dateDebut) >= new Date(dateFin)) {
            return res.status(400).json({ message: "La date de fin doit être après la date de début" });
        }

        const nouveauConge = new Conge({
            user: req.user.id,
            typeConge,
            dateDebut,
            dateFin,
            motif
        });

        await nouveauConge.save();
        await nouveauConge.populate('user', 'nom prenom email');
        
        res.status(201).json({ 
            message: "Demande de congé créée avec succès", 
            conge: nouveauConge 
        });
    } catch (error) {
        console.error("❌ Erreur création congé:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// Voir mes congés (SALARIE) - ⭐ CORRECTION: structure fixe
exports.getMesConges = async (req, res) => {
    try {
        console.log("🔄 getMesConges pour user:", req.user.id);
        
        const conges = await Conge.find({ user: req.user.id })
            .populate('user', 'nom prenom email')
            .sort({ createdAt: -1 });

        console.log(`📊 ${conges.length} congé(s) trouvé(s)`);

        // Récupérer les soldes
        let soldeConge = await SoldeConge.findOne({ user: req.user.id });
        if (!soldeConge) {
            soldeConge = new SoldeConge({ user: req.user.id });
            await soldeConge.save();
        }

        const soldes = {
            annuel: soldeConge.getSoldeRestant('Annuel'),
            maladie: soldeConge.getSoldeRestant('Maladie'),
            maternite: soldeConge.getSoldeRestant('Maternité'),
            paternite: soldeConge.getSoldeRestant('Paternité')
        };

        res.status(200).json({ 
            success: true,
            conges, 
            soldes 
        });
        
    } catch (error) {
        console.error("❌ Erreur getMesConges:", error);
        res.status(500).json({ 
            success: false,
            message: "Erreur lors du chargement des congés", 
            error: error.message 
        });
    }
};

// Voir toutes les demandes de congé (ADMIN_RH) - ⭐ CORRECTION
exports.getAllConges = async (req, res) => {
    try {
        console.log("🔄 getAllConges - ADMIN_RH");
        
        const conges = await Conge.find()
            .populate({
                path: 'user',
                select: 'nom prenom email role service poste',
                populate: {
                    path: 'service',
                    select: 'nomService'
                }
            })
            .sort({ createdAt: -1 });

        console.log(`📊 ${conges.length} congé(s) trouvé(s) pour l'admin`);

        res.status(200).json({
            success: true,
            conges
        });
    } catch (error) {
        console.error("❌ Erreur getAllConges:", error);
        res.status(500).json({ 
            success: false,
            message: "Erreur lors du chargement de tous les congés", 
            error: error.message 
        });
    }
};

// Valider ou refuser une demande de congé (ADMIN_RH)
exports.updateCongeStatus = async (req, res) => {
    try {
        const { statut } = req.body;
        
        if (!['Approuvé', 'Rejeté'].includes(statut)) {
            return res.status(400).json({ message: "Statut invalide" });
        }

        const conge = await Conge.findByIdAndUpdate(
            req.params.id, 
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
        
        if (!conge) {
            return res.status(404).json({ message: "Demande de congé non trouvée" });
        }

        res.status(200).json({ 
            message: `Demande de congé ${statut.toLowerCase()}`, 
            conge 
        });
    } catch (error) {
        console.error("❌ Erreur mise à jour statut congé:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// Récupérer les soldes
exports.getMesSoldes = async (req, res) => {
    try {
        let soldeConge = await SoldeConge.findOne({ user: req.user.id });
        
        if (!soldeConge) {
            soldeConge = new SoldeConge({ user: req.user.id });
            await soldeConge.save();
        }

        const soldes = {
            annuel: soldeConge.getSoldeRestant('Annuel'),
            maladie: soldeConge.getSoldeRestant('Maladie'),
            maternite: soldeConge.getSoldeRestant('Maternité'),
            paternite: soldeConge.getSoldeRestant('Paternité')
        };

        res.status(200).json(soldes);
    } catch (error) {
        console.error("❌ Erreur récupération soldes:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// Supprimer une demande de congé
exports.deleteConge = async (req, res) => {
    try {
        const conge = await Conge.findById(req.params.id);
        
        if (!conge) {
            return res.status(404).json({ message: "Demande de congé non trouvée" });
        }

        if (conge.user.toString() !== req.user.id && req.user.role !== 'ADMIN_RH') {
            return res.status(403).json({ message: "Accès refusé" });
        }

        await Conge.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ message: "Demande de congé supprimée avec succès" });
    } catch (error) {
        console.error("❌ Erreur suppression congé:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};