const mongoose = require('mongoose');

const soldeCongeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    soldeAnnuel: {
        type: Number,
        default: 30 
    },
    soldeMaladie: {
        type: Number,
        default: 15 
    },
    soldeMaternite: {
        type: Number,
        default: 112 
    },
    soldePaternite: {
        type: Number,
        default: 14 
    },
    congesPris: [{
        typeConge: String,
        dateDebut: Date,
        dateFin: Date,
        joursPris: Number,
        congeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conge'
        }
    }]
}, { timestamps: true });

// Méthode pour calculer le solde restant
soldeCongeSchema.methods.getSoldeRestant = function(typeConge) {
    const soldes = {
        'Annuel': this.soldeAnnuel,
        'Maladie': this.soldeMaladie,
        'Maternité': this.soldeMaternite,
        'Paternité': this.soldePaternite
    };

    const soldeInitial = soldes[typeConge] || 0;
    
    // Calculer les jours déjà pris pour ce type de congé
    const joursPris = this.congesPris
        .filter(c => c.typeConge === typeConge)
        .reduce((total, conge) => total + conge.joursPris, 0);

    return Math.max(0, soldeInitial - joursPris);
};

// Méthode pour ajouter un congé pris
soldeCongeSchema.methods.ajouterCongePris = function(conge) {
    const joursPris = Math.ceil((new Date(conge.dateFin) - new Date(conge.dateDebut)) / (1000 * 60 * 60 * 24)) + 1;
    
    this.congesPris.push({
        typeConge: conge.typeConge,
        dateDebut: conge.dateDebut,
        dateFin: conge.dateFin,
        joursPris: joursPris,
        congeId: conge._id
    });

    return this.save();
};

module.exports = mongoose.model('SoldeConge', soldeCongeSchema);