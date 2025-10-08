// controllers/pdf_controller.js
const Contrat = require("../models/contrat_model");
const Attestation = require("../models/attestation_model");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// 🔹 Générer un PDF pour un contrat spécifique
exports.generateContratPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const contrat = await Contrat.findById(id)
      .populate("user", "nom prenom email telephone adresse matricule")
      .populate("service", "nomService");

    if (!contrat) {
      return res.status(404).json({
        success: false,
        message: "Contrat non trouvé"
      });
    }

    // Créer le document PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurer les en-têtes pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contrat-${contrat.user.nom}-${contrat._id}.pdf"`);

    // Pipe le PDF vers la réponse
    doc.pipe(res);

    // En-tête du document
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('CONTRAT DE TRAVAIL', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Référence: ${contrat._id}`, { align: 'center' });
    
    doc.moveDown(2);

    // Informations du contrat
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('INFORMATIONS DU CONTRAT');
    
    doc.moveDown(1);
    
    // Ligne séparatrice
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();
    
    doc.moveDown(1);

    // Détails du contrat en colonnes
    const startY = doc.y;
    
    // Colonne gauche
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#34495e')
       .text('Type de contrat:', 50, startY);
    doc.font('Helvetica')
       .fillColor('#2c3e50')
       .text(contrat.typeContrat, 150, startY);
    
    doc.font('Helvetica-Bold')
       .text('Date de début:', 50, startY + 20);
    doc.font('Helvetica')
       .text(new Date(contrat.dateDebut).toLocaleDateString('fr-FR'), 150, startY + 20);
    
    if (contrat.dateFin) {
      doc.font('Helvetica-Bold')
         .text('Date de fin:', 50, startY + 40);
      doc.font('Helvetica')
         .text(new Date(contrat.dateFin).toLocaleDateString('fr-FR'), 150, startY + 40);
    }
    
    doc.font('Helvetica-Bold')
       .text('Statut:', 50, startY + 60);
    doc.font('Helvetica')
       .text(contrat.statut, 150, startY + 60);

    // Colonne droite
    if (contrat.salaire) {
      doc.font('Helvetica-Bold')
         .text('Salaire:', 300, startY);
      doc.font('Helvetica')
         .text(`${contrat.salaire.toLocaleString('fr-FR')} MGA`, 370, startY);
    }
    
    doc.font('Helvetica-Bold')
       .text('Poste:', 300, startY + 20);
    doc.font('Helvetica')
       .text(contrat.poste || 'Non spécifié', 370, startY + 20);
    
    doc.font('Helvetica-Bold')
       .text('Service:', 300, startY + 40);
    doc.font('Helvetica')
       .text(contrat.service.nomService, 370, startY + 40);

    doc.moveDown(4);

    // Informations de l'employé
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('INFORMATIONS DE L\'EMPLOYÉ');
    
    doc.moveDown(1);
    
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();
    
    doc.moveDown(1);

    const employeeY = doc.y;
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#34495e')
       .text('Nom complet:', 50, employeeY);
    doc.font('Helvetica')
       .fillColor('#2c3e50')
       .text(`${contrat.user.nom} ${contrat.user.prenom}`, 150, employeeY);
    
    doc.font('Helvetica-Bold')
       .text('Email:', 50, employeeY + 20);
    doc.font('Helvetica')
       .text(contrat.user.email, 150, employeeY + 20);
    
    if (contrat.user.telephone) {
      doc.font('Helvetica-Bold')
         .text('Téléphone:', 50, employeeY + 40);
      doc.font('Helvetica')
         .text(contrat.user.telephone, 150, employeeY + 40);
    }
    
    if (contrat.user.matricule) {
      doc.font('Helvetica-Bold')
         .text('Matricule:', 50, employeeY + 60);
      doc.font('Helvetica')
         .text(contrat.user.matricule, 150, employeeY + 60);
    }

    // Pied de page
    const footerY = 750;
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#95a5a6')
       .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 50, footerY, { align: 'center' });

    // Finaliser le PDF
    doc.end();

  } catch (error) {
    console.error("❌ Erreur génération PDF:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du PDF",
      error: error.message
    });
  }
};

// 🔹 Générer un PDF avec liste des contrats
exports.generateContratsListPDF = async (req, res) => {
  try {
    const { statut, typeContrat, service } = req.query;
    
    const filter = {};
    if (statut) filter.statut = statut;
    if (typeContrat) filter.typeContrat = typeContrat;
    if (service) filter.service = service;

    const contrats = await Contrat.find(filter)
      .populate("user", "nom prenom email matricule")
      .populate("service", "nomService")
      .sort({ dateDebut: -1 });

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="liste-contrats.pdf"');

    doc.pipe(res);

    // En-tête
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('LISTE DES CONTRATS', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - ${contrats.length} contrat(s)`, { align: 'center' });
    
    doc.moveDown(2);

    // Tableau des contrats
    let yPosition = doc.y;
    
    // En-tête du tableau
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#ffffff')
       .rect(50, yPosition, 500, 20)
       .fill('#34495e');
    
    doc.text('Employé', 60, yPosition + 5);
    doc.text('Type', 200, yPosition + 5);
    doc.text('Début', 260, yPosition + 5);
    doc.text('Fin', 320, yPosition + 5);
    doc.text('Salaire', 380, yPosition + 5);
    doc.text('Statut', 450, yPosition + 5);
    
    yPosition += 25;

    // Lignes du tableau
    contrats.forEach((contrat, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
      
      doc.fillColor('#2c3e50')
         .rect(50, yPosition, 500, 15)
         .fill(bgColor);
      
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#2c3e50')
         .text(`${contrat.user.nom} ${contrat.user.prenom}`, 60, yPosition + 3);
      doc.text(contrat.typeContrat, 200, yPosition + 3);
      doc.text(new Date(contrat.dateDebut).toLocaleDateString('fr-FR'), 260, yPosition + 3);
      doc.text(contrat.dateFin ? new Date(contrat.dateFin).toLocaleDateString('fr-FR') : '-', 320, yPosition + 3);
      doc.text(contrat.salaire ? `${contrat.salaire.toLocaleString('fr-FR')} MGA` : '-', 380, yPosition + 3);
      doc.text(contrat.statut, 450, yPosition + 3);
      
      yPosition += 18;
    });

    doc.end();

  } catch (error) {
    console.error("❌ Erreur génération liste PDF:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération de la liste PDF",
      error: error.message
    });
  }
};

// controllers/pdf_controller.js 
exports.generateAttestationPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const attestation = await Attestation.findById(id)
      .populate('user', 'nom prenom email role service poste')
      .populate('user.service', 'nomService');

    if (!attestation || attestation.statut !== 'Approuvé') {
      return res.status(404).json({
        success: false,
        message: "Attestation non trouvée ou non approuvée"
      });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="attestation-${attestation.typeAttestation}-${attestation.user.nom}-${attestation._id}.pdf"`);

    doc.pipe(res);

    // En-tête du document
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('ATTESTATION', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#7f8c8d')
       .text(attestation.typeAttestation.toUpperCase(), { align: 'center' });
    
    doc.moveDown(2);

    // Contenu de l'attestation
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#2c3e50')
       .text('Je soussigné(e), responsable des ressources humaines, atteste que :', { align: 'justify' });
    
    doc.moveDown(1);

    // Informations de l'employé
    const infoY = doc.y;
    doc.font('Helvetica-Bold')
       .text('Nom :', 50, infoY);
    doc.font('Helvetica')
       .text(attestation.user.nom, 120, infoY);
    
    doc.font('Helvetica-Bold')
       .text('Prénom :', 50, infoY + 20);
    doc.font('Helvetica')
       .text(attestation.user.prenom, 120, infoY + 20);
    
    doc.font('Helvetica-Bold')
       .text('Rôle :', 50, infoY + 40);
    doc.font('Helvetica')
       .text(attestation.user.role, 120, infoY + 40);
    
    if (attestation.user.service) {
      doc.font('Helvetica-Bold')
         .text('Service :', 50, infoY + 60);
      doc.font('Helvetica')
         .text(attestation.user.service.nomService, 120, infoY + 60);
    }
    
    if (attestation.user.poste) {
      doc.font('Helvetica-Bold')
         .text('Poste :', 50, infoY + 80);
      doc.font('Helvetica')
         .text(attestation.user.poste, 120, infoY + 80);
    }

    doc.moveDown(6);

    // Contenu personnalisé
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#34495e')
       .text(attestation.contenu || 'Cette attestation est délivrée pour faire valoir ce que de droit.', {
         align: 'justify'
       });

    doc.moveDown(4);

    // Signature
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#95a5a6')
       .text(`Fait à Toamasina, le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
    
    doc.moveDown(2);
    doc.text('_________________________', { align: 'right' });
    doc.text('Signature du Responsable RH', { align: 'right' });

    doc.end();

  } catch (error) {
    console.error("❌ Erreur génération PDF attestation:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du PDF",
      error: error.message
    });
  }
};