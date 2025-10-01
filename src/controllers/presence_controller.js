const Presence = require("../models/presence_model");
const User = require("../models/user_model");

// pointer arrivee
exports.pointerArrivee = async (req, res) => {
    try {
        const userId = req.user.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let presence = await Presence.findOne({ user: userId, date: today });
        if (presence) {
            return res.status(400).json({ message: "Vous avez déjà pointé votre arrivée aujourd'hui." });
        }

        presence = await Presence.create({
            user: userId,
            date: today,
            heureArrivee: new Date(),
            statut: 'Présent'
        });

        res.status(201).json({ message: "Arrivée pointée avec succès", presence });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// pointer depart
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
    }

    catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};


//Consulter son historique de présence
exports.getHistoriquePersonnel = async (req, res) => {
    try {
        const userId = req.user.userId;
        const MesPresences = await Presence.find({ user: userId }).sort({ date: -1 });
        res.status(200).json(MesPresences);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Consulter l'historique de présence de tous les employés (ADMIN_RH)
exports.getAllPresences = async (req, res) => {
    try {
        const presences = await Presence.find().populate('user', 'nom prenom role').sort({ date: -1 });
        res.status(200).json(presences);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Marquer une absence (ADMIN_RH)
exports.marquerAbsence = async (req, res) => {
    try {
        const { userId, date } = req.body;
        const absence = await Presence.create({
            user: userId,
            date: new Date(date),
            statut: 'Absent'
        });
        res.status(201).json({ message: "Absence bien marquée ", absence });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

