const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user_model');

// Enregistrement d'un nouvel utilisateur
exports.register = async (req, res) => {
    const { nom, prenom, email, motDePasse, role } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }
        const hashedPassword = await bcrypt.hash(motDePasse, 10);
        const newUser = new User({ nom, prenom, email, motDePasse: hashedPassword, role });
        await newUser.save();
        res.status(201).json({ message: 'Utilisateur enregistré avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
    const { email, motDePasse } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }

        const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }
        
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token, user: { id: user._id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};