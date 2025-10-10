const Attestation = require("../models/attestation_model");
const User = require("../models/user_model");

// Créer demande par un salarié
exports.demandeSalarie = async (req, res) => {
    try {
        const { typeAttestation, contenu } = req.body;
        const enumType = ['Travail', 'Salaire', 'Autre'];
        if (!enumType.includes(typeAttestation)) {
            return res.status(400).json({ message: "Type d'attestation invalide pour un salarié" });
        }
        const nouvelleDemande = await Attestation.create({
            user: req.user.id,
            typeAttestation,
            contenu,
            statut: 'En Attente'
        });
        res.status(201).json({ message: "Demande d'attestation créée avec succès", attestation: nouvelleDemande });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Prévisualiser demandes par un salarié
exports.previewSalarie = async (req, res) => {
    try {
        const { typeAttestation } = req.body;
        const user = await User.findById(req.user.id);
        
        const preview = {
            nom: user.nom,
            prenom: user.prenom,
            typeAttestation: typeAttestation,
            date: new Date().toLocaleDateString(),
            contenu: `Ceci est une attestation de type ${typeAttestation} pour ${user.nom} ${user.prenom}.`
        };
        res.status(200).json(preview);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};   

// Créer demande par un stagiaire
exports.demandeStagiaire = async (req, res) => {
    try {
        console.log("📝 Demande attestation stagiaire - User ID:", req.user.id);
        
        const { typeAttestation, contenu } = req.body;
        const enumType = ['Stage', 'Autre'];
        if (!enumType.includes(typeAttestation)) {
            return res.status(400).json({ message: "Type d'attestation invalide pour un stagiaire" });
        }
        const nouvelleDemande = await Attestation.create({
            user: req.user.id,
            typeAttestation,
            contenu,
            statut: 'En Attente'
        });
        res.status(201).json({ message: "Demande d'attestation créée avec succès", attestation: nouvelleDemande });
    } catch (error) {
        console.error("❌ Erreur création demande:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Vérifier l'éligibilité d'un stagiaire - ⭐ UNE SEULE FONCTION
exports.checkEligibility = async (req, res) => {
    try {
        console.log("=== 🟢 CHECK ELIGIBILITY APPELÉE ===");
        console.log("🔍 User ID:", req.user.id);
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            console.log("❌ Utilisateur non trouvé");
            return res.status(404).json({ 
                eligible: false, 
                reason: "Utilisateur non trouvé" 
            });
        }

        console.log("👤 User trouvé:", user.prenom, user.nom, "- Role:", user.role);

        if (user.role !== 'STAGIAIRE') {
            console.log("❌ Mauvais rôle:", user.role);
            return res.status(400).json({ 
                eligible: false, 
                reason: "Accès réservé aux stagiaires" 
            });
        }

        if (!user.dateFinStage) {
            console.log("❌ Date fin stage manquante");
            return res.status(400).json({ 
                eligible: false, 
                reason: "Date de fin de stage non définie" 
            });
        }

        const now = new Date();
        const dateFin = new Date(user.dateFinStage);
        const joursRestants = Math.ceil((dateFin - now) / (1000 * 60 * 60 * 24));

        console.log("📅 Calcul éligibilité - Jours restants:", joursRestants);

        // Éligible si stage terminé ou dans les 7 derniers jours
        const eligible = joursRestants <= 7;

        console.log("🎯 Résultat éligibilité:", eligible);

        res.json({ 
            eligible,
            reason: eligible 
                ? `Éligible - ${joursRestants <= 0 ? 'Stage terminé' : `Fin dans ${joursRestants} jour(s)`}`
                : `Non éligible - ${joursRestants} jour(s) restant(s)`,
            joursRestants,
            dateFinStage: user.dateFinStage
        });

    } catch (error) {
        console.error("💥 ERREUR dans checkEligibility:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// Récupérer les attestations de l'utilisateur connecté
exports.getMesAttestations = async (req, res) => {
    try {
        console.log("📊 Récupération attestations pour user:", req.user.id);
        
        const attestations = await Attestation.find({ user: req.user.id })
            .populate('user', 'nom prenom email role')
            .sort({ createdAt: -1 });

        console.log(`✅ ${attestations.length} attestation(s) trouvée(s)`);

        res.status(200).json({
            success: true,
            attestations: attestations || []
        });
    } catch (error) {
        console.error("❌ Erreur récupération attestations:", error);
        res.status(500).json({ 
            success: false,
            message: "Erreur lors du chargement de vos attestations", 
            error: error.message 
        });
    }
};

// Générer attestation par un admin RH
exports.generateAttestation = async (req, res) => {
    try {
        const { id } = req.params;
        const attestation = await Attestation.findByIdAndUpdate(
            id,
            { statut: 'Approuvé', dateDemande: new Date() },
            { new: true }
        ).populate('user', 'nom prenom email role service poste');
        
        if (!attestation) {
            return res.status(404).json({ message: "Attestation non trouvée" });
        }
        
        res.status(200).json({ message: "Attestation générée avec succès", attestation });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Télécharger attestation 
exports.downloadAttestation = async (req, res) => {
    try {
        const { id } = req.params;
        const attestation = await Attestation.findById(id).populate('user', 'nom prenom email role service poste');
        if (!attestation || attestation.statut !== 'Approuvé') {
            return res.status(404).json({ message: "Attestation non trouvée ou non approuvée" });
        }
        
        // Générer le contenu de l'attestation
        const attestationContent = `
ATTESTATION ${attestation.typeAttestation.toUpperCase()}

Je soussigné(e), responsable des ressources humaines, atteste que :

Nom : ${attestation.user.nom}
Prénom : ${attestation.user.prenom}
Rôle : ${attestation.user.role}
${attestation.user.service ? `Service : ${attestation.user.service.nomService}` : ''}
${attestation.user.poste ? `Poste : ${attestation.user.poste}` : ''}

${attestation.contenu || `Cette attestation est délivrée pour faire valoir ce que de droit.`}

Fait à Toamasina, le ${new Date().toLocaleDateString('fr-FR')}

Signature
_________________________
Responsable RH
        `;
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=attestation_${attestation.typeAttestation}_${attestation.user.nom}_${attestation.user.prenom}.txt`);
        res.send(attestationContent);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Voir historique des demandes des salariés et stagiaires
exports.getHistorique = async (req, res) => {
    try {
        const historique = await Attestation.find()
            .populate({
                path: 'user',
                select: 'nom prenom role service poste',
                populate: {
                    path: 'service',
                    select: 'nomService'
                }
            });
        res.status(200).json(historique);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Voir toutes les demandes d'attestation (ADMIN_RH)
exports.getAllAttestations = async (req, res) => {
    try {
        const attestations = await Attestation.find()
            .populate({
                path: 'user',
                select: 'nom prenom email role service poste',
                populate: {
                    path: 'service',
                    select: 'nomService'
                }
            });
        res.status(200).json(attestations);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};