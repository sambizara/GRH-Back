const mongoose = require('mongoose');

const posteSchema = new mongoose.Schema({
    nomPoste: { type: String, required: true},
    description: { type: String},
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    }
}, { timestamps: true});

module.exports = mongoose.model('Poste', posteSchema);