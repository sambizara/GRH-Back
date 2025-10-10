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
        typeConge: {
            type: String,
            enum: ['Annuel', 'Maladie', 'Sans Solde', 'Maternité', 'Paternité'],
            required: true
        },
        dateDebut: {
            type: Date,
            required: true
        },
        dateFin: {
            type: Date,
            required: true
        },
        joursPris: {
            type: Number,
            required: true,
            min: 1
        },
        congeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conge',
            required: true
        },
        datePrise: {
            type: Date,
            default: Date.now
        }
    }]
}, { 
    timestamps: true 
});

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

    const soldeRestant = Math.max(0, soldeInitial - joursPris);
    
    console.log(`📊 Solde ${typeConge}: ${soldeInitial} - ${joursPris} = ${soldeRestant} jours restants`);
    
    return soldeRestant;
};

// Méthode pour ajouter un congé pris
soldeCongeSchema.methods.ajouterCongePris = function(conge) {
    const joursPris = Math.ceil((new Date(conge.dateFin) - new Date(conge.dateDebut)) / (1000 * 60 * 60 * 24)) + 1;
    
    // Vérifier si le congé n'existe pas déjà
    const existeDeja = this.congesPris.some(c => c.congeId.toString() === conge._id.toString());
    
    if (!existeDeja) {
        this.congesPris.push({
            typeConge: conge.typeConge,
            dateDebut: conge.dateDebut,
            dateFin: conge.dateFin,
            joursPris: joursPris,
            congeId: conge._id
        });

        console.log(`➕ Congé ajouté: ${joursPris} jours de ${conge.typeConge}`);
        return this.save();
    } else {
        console.log(`ℹ️ Congé déjà présent dans les soldes`);
        return Promise.resolve(this);
    }
};

// Méthode pour retirer un congé pris (remboursement)
soldeCongeSchema.methods.retirerCongePris = function(congeId) {
    const congeIndex = this.congesPris.findIndex(c => c.congeId.toString() === congeId.toString());
    
    if (congeIndex !== -1) {
        const congeRetire = this.congesPris[congeIndex];
        this.congesPris.splice(congeIndex, 1);
        
        console.log(`➖ Congé retiré: ${congeRetire.joursPris} jours de ${congeRetire.typeConge}`);
        return this.save();
    }
    
    return Promise.resolve(this);
};

// Méthode statique pour initialiser un solde
soldeCongeSchema.statics.initialiserSolde = function(userId) {
    return this.findOneAndUpdate(
        { user: userId },
        { 
            user: userId,
            soldeAnnuel: 30,
            soldeMaladie: 15,
            soldeMaternite: 112,
            soldePaternite: 14,
            congesPris: []
        },
        { upsert: true, new: true }
    );
};

module.exports = mongoose.model('SoldeConge', soldeCongeSchema);