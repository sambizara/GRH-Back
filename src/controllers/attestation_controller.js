const Attestation = require("../models/attestation_model");
const { User } = require("../models/user_model");

// 🧾 1️⃣ Demande manuelle d’un salarié
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

    res.status(201).json({
      message: "Demande d'attestation créée avec succès",
      attestation: nouvelleDemande
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 🧩 2️⃣ Prévisualisation pour salarié
exports.previewSalarie = async (req, res) => {
  try {
    const { typeAttestation } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const preview = {
      nom: user.nom,
      prenom: user.prenom,
      typeAttestation,
      date: new Date().toLocaleDateString(),
      contenu: `Ceci est une attestation de type ${typeAttestation} pour ${user.nom} ${user.prenom}.`
    };
    res.status(200).json(preview);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la prévisualisation", error });
  }
};

// 🚫 3️⃣ Suppression de la demande stagiaire (plus de demande manuelle)
exports.demandeStagiaire = async (req, res) => {
  res.status(403).json({
    message: "Les stagiaires ne peuvent pas demander d’attestation manuellement. Elle est générée automatiquement à la fin du stage."
  });
};

// 🧠 4️⃣ Génération automatique quand stage terminé
exports.genererAutomatiqueStage = async (stagiaireId, adminId = null) => {
  const stagiaire = await User.findById(stagiaireId).populate('service');
  if (!stagiaire) throw new Error("Stagiaire introuvable");

  const contenu = `
ATTESTATION DE STAGE

Nous soussignés, [Nom de l’entreprise], certifions que ${stagiaire.nom} ${stagiaire.prenom} 
a effectué un stage au sein du service ${stagiaire.service?.nomService || '—'} 
du ${stagiaire.dateDebutStage?.toLocaleDateString('fr-FR') || '—'} 
au ${stagiaire.dateFinStage?.toLocaleDateString('fr-FR') || '—'}.

Le stage s’est déroulé avec assiduité et professionnalisme.

Fait à Toamasina, le ${new Date().toLocaleDateString('fr-FR')}.
`;

  const attestation = new Attestation({
    user: stagiaire._id,
    typeAttestation: 'Stage',
    contenu,
    statut: 'Automatique',
    generePar: adminId
  });

  await attestation.save();
  return attestation;
};

// 📋 5️⃣ Récupérer mes attestations
exports.getMesAttestations = async (req, res) => {
  try {
    const attestations = await Attestation.find({ user: req.user.id })
      .populate('user', 'nom prenom role')
      .sort({ createdAt: -1 });
    res.status(200).json(attestations);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des attestations", error });
  }
};

// 🧾 6️⃣ Générer (valider) une attestation par admin RH
exports.generateAttestation = async (req, res) => {
  try {
    const { id } = req.params;
    const attestation = await Attestation.findByIdAndUpdate(
      id,
      { statut: 'Approuvé', generePar: req.user.id },
      { new: true }
    ).populate('user', 'nom prenom email role service poste');
    if (!attestation) return res.status(404).json({ message: "Attestation non trouvée" });
    res.status(200).json({ message: "Attestation approuvée", attestation });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// 🧾 7️⃣ Télécharger une attestation (admin ou propriétaire)
exports.downloadAttestation = async (req, res) => {
  try {
    const { id } = req.params;
    const attestation = await Attestation.findById(id).populate('user', 'nom prenom role service');
    if (!attestation) return res.status(404).json({ message: "Attestation introuvable" });

    const contenu = `
ATTESTATION ${attestation.typeAttestation.toUpperCase()}

Je soussigné(e), responsable RH, atteste que :

Nom : ${attestation.user.nom}
Prénom : ${attestation.user.prenom}
Rôle : ${attestation.user.role}
Service : ${attestation.user.service?.nomService || '-'}

${attestation.contenu}

Fait à Toamasina, le ${new Date().toLocaleDateString('fr-FR')}
_________________________
Responsable RH
`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=attestation_${attestation.typeAttestation}_${attestation.user.nom}.txt`);
    res.send(contenu);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du téléchargement", error });
  }
};

// 🧮 8️⃣ Historique (admin)
exports.getHistorique = async (req, res) => {
  try {
    const historique = await Attestation.find()
      .populate('user', 'nom prenom role service poste')
      .populate('generePar', 'nom prenom role');
    res.status(200).json(historique);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
