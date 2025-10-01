const Attestation = require("../models/attestation_model");
const User = require("../models/user_model");

//Creer demande par un salarie
exports.demandeSalarie = async (req, res) => {
    try {
        const { typeAttestation, contenu } = req.body;
        const enumType = ['Travail', 'Salaire', 'Autre'];
        if (!enumType.includes(typeAttestation)) {
            return res.status(400).json({ message: "Type d'attestation invalide pour un salarié" });
        }
        const nouvelleDemande = await Attestation.create({
            user: req.user.userId,
            typeAttestation,
            contenu,
            statut: 'En Attente'
        });
        res.status(201).json({ message: "Demande d'attestation créée avec succès", attestation: nouvelleDemande });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Previsualiser demandes par un salarie
exports.previewSalarie = async (req, res) => {
    try {
        const {typeAttestation} = req.body;
        const preview = {
            nom: `${req.user.nom}`,
            prenom: `${req.user.prenom}`,
            typeAttestation: typeAttestation,
            date: new Date().toLocaleDateString(),
            contenu: `Ceci est une attestation de type ${typeAttestation} pour ${req.user.nom} ${req.user.prenom}.`
        };
        res.status(200).json(preview);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};   

//Creer demande par un stagiaire
exports.demandeStagiaire = async (req, res) => {
    try {
        const { typeAttestation, contenu } = req.body;
        const enumType = ['Stage', 'Autre'];
        if (!enumType.includes(typeAttestation)) {
            return res.status(400).json({ message: "Type d'attestation invalide pour un stagiaire" });
        }
        const nouvelleDemande = await Attestation.create({
            user: req.user.userId,  
            typeAttestation,
            contenu,
            statut: 'En Attente'
        });
        res.status(201).json({ message: "Demande d'attestation créée avec succès", attestation: nouvelleDemande });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Verifier l'eligibilite d'un stagiaire
exports.checkEligibility = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.role !== 'STAGIAIRE') {
            return res.status(400).json({ eligible: false, reason: "Utilisateur non trouvé ou non stagiaire" });
        }

        if (!user.dateFinStage || new Date() < new Date(user.dateFinStage)) {
            return res.status(400).json({ eligible: false, reason: "Stage en cours ou date de fin non définie" });
        }

        res.json({ eligible: true });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Generer attestation par un admin RH
exports.generateAttestation = async (req, res) => {
    try {
        const { idDemande } = req.body;
        const attestation = await Attestation.findByIdAndUpdate(
            idDemande,
            { statut: 'Approuvé', dateDemande: new Date() },
            { new: true }
        ).populate('user', 'nom prenom email role');
        res.status(200).json({ message: "Attestation générée avec succès", attestation });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

//Telecharger attestation 
exports.downloadAttestation = async (req, res) => {
    try {
        const { id } = req.params;
        const attestation = await Attestation.findById(id).populate('user', 'nom prenom email role');
        if (!attestation || attestation.statut !== 'Approuvé') {
            return res.status(404).json({ message: "Attestation non trouvée ou non approuvée" });
        }
        res.json({ message: "Attestation prête pour le téléchargement", attestation });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};


//Voir historique des demandes des salaries et stagiaires
exports.getHistorique = async (req, res) => {
    try {
        const historique = await Attestation.find()
            .populate('user', 'nom prenom role');
        res.status(200).json(historique);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Voir toutes les demandes d'attestation (ADMIN_RH)
exports.getAllAttestations = async (req, res) => {
    try {
        const attestations = await Attestation.find().populate('user', 'nom prenom email role');
        res.status(200).json(attestations);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};













//--------------------------------------------------------------
// // Créer une nouvelle attestation
// exports.createAttestation = async (req, res) => {
//     try {
//         const { typeAttestation, contenu } = req.body;

//         const nouvelleAttestation = new Attestation({
//             user: req.user.userId,
//             typeAttestation,
//             contenu,
//             statut: 'En Attente'
//         });

//         await nouvelleAttestation.save();
//         res.status(201).json({ message: "Attestation créée avec succès", attestation: nouvelleAttestation });
//     } catch (error) {
//         res.status(500).json({ message: "Erreur serveur", error });
//     }
// };

// // Voir mes attestations (salarié / Stagiaire)
// exports.getMesAttestations = async (req, res) => {
//     try {
//         const attestations = await Attestation.find({ user: req.user.userId }).populate('user', 'nom prenom email');
//         res.status(200).json(attestations);
//     } catch (error) {
//         res.status(500).json({ message: "Erreur serveur", error });
//     }
// };

// // Voir toutes les demandes d'attestation (ADMIN_RH)
// exports.getAllAttestations = async (req, res) => {
//     try {
//         const attestations = await Attestation.find().populate('user', 'nom prenom email role');
//         res.status(200).json(attestations);
//     } catch (error) {
//         res.status(500).json({ message: "Erreur serveur", error });
//     }
// };

// //Telecharger attestation 
// exports.downloadAttestation = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const attestation = await Attestation.findById(id).populate('user', 'nom prenom email role');
//         if (!attestation || attestation.statut !== 'Approuvé') {
//             return res.status(404).json({ message: "Attestation non trouvée ou non approuvée" });
//         }
//         res.setHeader('Content-Disposition', `attachment; filename=attestation_${attestation._id}.txt`);
//         res.setHeader('Content-Type', 'text/plain');
//         const attestationContent = `
//         Attestation de ${attestation.typeAttestation}
//         ------------------------------
//         Nom: ${attestation.user.nom}
//         Prénom: ${attestation.user.prenom}
//         Date de demande: ${attestation.dateDemande.toLocaleDateString()}
//         Contenu: ${attestation.contenu}
//         ------------------------------
//         `;
//         res.send(attestationContent);
//     } catch (error) {
//         res.status(500).json({ message: "Erreur serveur", error });
//     }
// };
// // Generer ou refuser une attestation (ADMIN_RH)
// exports.updateAttestationStatus = async (req, res) => {
//     try {
//         const { statut, contenu } = req.body;
//         const attestation = await Attestation.findByIdAndUpdate(
//             req.params.id,
//             { statut, contenu },
//             { new: true }
//         ).populate('user', 'nom prenom email role');

//         if (!attestation) {
//             return res.status(404).json({ message: "Attestation non trouvée" });
//         }

//         res.status(200).json({ message: "Statut de l'attestation mis à jour", attestation });
//     } catch (error) {
//         res.status(500).json({ message: "Erreur serveur", error });
//     }
// };