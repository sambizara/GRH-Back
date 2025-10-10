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

// Voir mes congés (SALARIE)
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

// Voir toutes les demandes de congé (ADMIN_RH)
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

// Valider ou refuser une demande de congé (ADMIN_RH) - VERSION CORRIGÉE
exports.updateCongeStatus = async (req, res) => {
    try {
        const { statut } = req.body;
        
        if (!['Approuvé', 'Rejeté'].includes(statut)) {
            return res.status(400).json({ message: "Statut invalide" });
        }

        // Récupérer le congé avant mise à jour
        const congeAvant = await Conge.findById(req.params.id);
        if (!congeAvant) {
            return res.status(404).json({ message: "Demande de congé non trouvée" });
        }

        // Mettre à jour le statut
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

        // ⭐ NOUVELLE LOGIQUE : Gestion des soldes
        let soldeConge = await SoldeConge.findOne({ user: conge.user._id });
        if (!soldeConge) {
            soldeConge = new SoldeConge({ user: conge.user._id });
            await soldeConge.save();
        }

        const joursPris = Math.ceil(
            (new Date(conge.dateFin) - new Date(conge.dateDebut)) / (1000 * 60 * 60 * 24)
        ) + 1;

        console.log(`📅 Traitement congé: ${joursPris} jours de ${conge.typeConge} - Statut: ${statut}`);

        // Cas 1: Congé approuvé (ancien statut n'était pas approuvé)
        if (statut === 'Approuvé' && congeAvant.statut !== 'Approuvé') {
            console.log(`✅ Congé approuvé: déduction de ${joursPris} jours`);
            
            // Vérifier si le congé n'est pas déjà dans la liste
            const dejaPris = soldeConge.congesPris.some(c => c.congeId.toString() === conge._id.toString());
            if (!dejaPris) {
                await soldeConge.ajouterCongePris(conge);
                console.log(`💰 Solde déduit pour ${conge.user.prenom} ${conge.user.nom}`);
            } else {
                console.log(`ℹ️ Congé déjà déduit du solde`);
            }
        }
        
        // Cas 2: Congé rejeté (ancien statut était approuvé) - REMBOURSEMENT
        else if (statut === 'Rejeté' && congeAvant.statut === 'Approuvé') {
            console.log(`🔄 Congé rejeté: remboursement de ${joursPris} jours`);
            
            // Retirer le congé de la liste des congés pris
            soldeConge.congesPris = soldeConge.congesPris.filter(
                c => c.congeId.toString() !== conge._id.toString()
            );
            await soldeConge.save();
            console.log(`💵 Solde remboursé pour ${conge.user.prenom} ${conge.user.nom}`);
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

        // Si le congé était approuvé, rembourser le solde
        if (conge.statut === 'Approuvé') {
            const soldeConge = await SoldeConge.findOne({ user: conge.user });
            if (soldeConge) {
                soldeConge.congesPris = soldeConge.congesPris.filter(
                    c => c.congeId.toString() !== conge._id.toString()
                );
                await soldeConge.save();
                console.log(`💰 Solde remboursé suite à suppression du congé`);
            }
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

// Route de diagnostic des soldes (pour debug)
exports.getDiagnosticSolde = async (req, res) => {
    try {
        const soldeConge = await SoldeConge.findOne({ user: req.params.userId })
            .populate('user', 'nom prenom email');
        
        if (!soldeConge) {
            return res.status(404).json({ message: "Aucun solde trouvé pour cet utilisateur" });
        }

        const diagnostics = {
            utilisateur: {
                nom: soldeConge.user.nom,
                prenom: soldeConge.user.prenom,
                email: soldeConge.user.email
            },
            soldeInitial: {
                annuel: soldeConge.soldeAnnuel,
                maladie: soldeConge.soldeMaladie,
                maternite: soldeConge.soldeMaternite,
                paternite: soldeConge.soldePaternite
            },
            soldesRestants: {
                annuel: soldeConge.getSoldeRestant('Annuel'),
                maladie: soldeConge.getSoldeRestant('Maladie'),
                maternite: soldeConge.getSoldeRestant('Maternité'),
                paternite: soldeConge.getSoldeRestant('Paternité')
            },
            congesPris: soldeConge.congesPris.map(c => ({
                type: c.typeConge,
                jours: c.joursPris,
                periode: `${new Date(c.dateDebut).toLocaleDateString()} à ${new Date(c.dateFin).toLocaleDateString()}`,
                congeId: c.congeId
            })),
            totalJoursPris: soldeConge.congesPris.reduce((total, c) => total + c.joursPris, 0),
            statistiques: {
                totalCongesPris: soldeConge.congesPris.length,
                parType: {
                    annuel: soldeConge.congesPris.filter(c => c.typeConge === 'Annuel').reduce((total, c) => total + c.joursPris, 0),
                    maladie: soldeConge.congesPris.filter(c => c.typeConge === 'Maladie').reduce((total, c) => total + c.joursPris, 0),
                    maternite: soldeConge.congesPris.filter(c => c.typeConge === 'Maternité').reduce((total, c) => total + c.joursPris, 0),
                    paternite: soldeConge.congesPris.filter(c => c.typeConge === 'Paternité').reduce((total, c) => total + c.joursPris, 0)
                }
            }
        };

        res.json({
            success: true,
            diagnostics
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};