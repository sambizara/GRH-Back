const Presence = require("../models/presence_model");
const User = require("../models/user_model");

// Pointer arrivée
exports.pointerArrivee = async (req, res) => {
    try {
        const userId = req.user.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let presence = await Presence.findOne({ user: userId, date: today });
        if (presence) {
            return res.status(400).json({ message: "Vous avez déjà pointé votre arrivée aujourd'hui." });
        }

        // Déterminer le statut basé sur l'heure (retard après 9h00)
        const now = new Date();
        const heureLimite = new Date();
        heureLimite.setHours(9, 0, 0, 0); // 9h00 comme heure limite
        const statut = now > heureLimite ? 'En Retard' : 'Présent';

        presence = await Presence.create({
            user: userId,
            date: today,
            heureArrivee: now,
            statut: statut
        });

        res.status(201).json({ message: "Arrivée pointée avec succès", presence });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Pointer départ
exports.pointerDepart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let presence = await Presence.findOne({ user: userId, date: today });
        if (!presence) {
            return res.status(400).json({ message: "Vous n'avez pas encore pointé votre arrivée aujourd'hui." });
        }
        if (presence.heureDepart) {
            return res.status(400).json({ message: "Vous avez déjà pointé votre départ aujourd'hui." });
        }
        
        presence.heureDepart = new Date();
        await presence.save();
        
        res.status(200).json({ message: "Départ pointé avec succès", presence });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Consulter son historique de présence
exports.getHistoriquePersonnel = async (req, res) => {
    try {
        const userId = req.user.userId;
        const mesPresences = await Presence.find({ user: userId })
            .populate('user', 'nom prenom role')
            .sort({ date: -1 });
        res.status(200).json(mesPresences);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Consulter l'historique de présence de tous les employés (ADMIN_RH)
exports.getAllPresences = async (req, res) => {
    try {
        const presences = await Presence.find()
            .populate({
                path: 'user',
                select: 'nom prenom email role service poste',
                populate: {
                    path: 'service',
                    select: 'nomService'
                }
            })
            .sort({ date: -1, heureArrivee: -1 });
        res.status(200).json(presences);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Marquer une absence (ADMIN_RH)
exports.marquerAbsence = async (req, res) => {
    try {
        const { userId, date } = req.body;
        
        // Vérifier si une présence existe déjà pour cette date
        const existingPresence = await Presence.findOne({ 
            user: userId, 
            date: new Date(date) 
        });
        
        if (existingPresence) {
            return res.status(400).json({ message: "Une présence existe déjà pour cette date." });
        }

        const absence = await Presence.create({
            user: userId,
            date: new Date(date),
            statut: 'Absent'
        });

        res.status(201).json({ message: "Absence marquée avec succès", absence });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Ajouter manuellement une présence (ADMIN_RH) - NOUVELLE FONCTION
exports.ajouterPresenceManuelle = async (req, res) => {
    try {
        const { userId, date, heureArrivee, heureDepart, statut } = req.body;
        
        // Vérifier si une présence existe déjà pour cette date
        const existingPresence = await Presence.findOne({ 
            user: userId, 
            date: new Date(date) 
        });
        
        if (existingPresence) {
            return res.status(400).json({ message: "Une présence existe déjà pour cette date." });
        }

        const presence = await Presence.create({
            user: userId,
            date: new Date(date),
            heureArrivee: heureArrivee ? new Date(heureArrivee) : undefined,
            heureDepart: heureDepart ? new Date(heureDepart) : undefined,
            statut: statut || 'Présent'
        });

        res.status(201).json({ message: "Présence ajoutée avec succès", presence });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};