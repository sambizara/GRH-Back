// controllers/service_controller.js
const Service = require("../models/service_model");
const User = require("../models/user_model");

// Créer un service
exports.createService = async (req, res) => {
    try {
        const { nomService, description, postes, responsable } = req.body;

        // ✅ Validation améliorée
        if (!nomService) {
            return res.status(400).json({ message: "Le nom du service est obligatoire." });
        }

        const existingService = await Service.findOne({ 
            nomService: nomService.toUpperCase().trim() 
        });
        if (existingService) {
            return res.status(400).json({ message: "Un service avec ce nom existe déjà." });
        }

        // ✅ Vérifier si le responsable existe
        if (responsable) {
            const responsableUser = await User.findById(responsable);
            if (!responsableUser || responsableUser.role !== "SALARIE") {
                return res.status(400).json({ message: "Le responsable doit être un salarié existant." });
            }
        }

        const service = new Service({ 
            nomService: nomService.toUpperCase().trim(),
            description: description?.trim(),
            postes: postes ? postes.map(p => p.toUpperCase().trim()) : [],
            responsable: responsable || null
        });
        
        await service.save();
        
        // ✅ Populate pour avoir les infos du responsable
        await service.populate('responsable', 'nom prenom email');
        
        res.status(201).json({ 
            message: "Service créé avec succès", 
            service 
        });
    } catch (error) {
        console.error("❌ Erreur création service:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// Voir tous les services (actifs seulement par défaut)
exports.getAllServices = async (req, res) => {
    try {
        const { includeInactive } = req.query; // ✅ Option pour voir les services inactifs
        
        const filter = includeInactive ? {} : { actif: true };
        
        const services = await Service.find(filter)
            .populate('responsable', 'nom prenom email')
            .sort({ nomService: 1 }); // ✅ Tri alphabétique
            
        res.status(200).json(services);
    } catch (error) {
        console.error("❌ Erreur récupération services:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// Voir un service par ID
exports.getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate('responsable', 'nom prenom email');
            
        if (!service) {
            return res.status(404).json({ message: "Service non trouvé" });
        }
        
        // ✅ Récupérer les utilisateurs de ce service
        const utilisateurs = await User.find({ 
            service: req.params.id,
            actif: true 
        }).select('nom prenom email role poste');
        
        res.status(200).json({
            service,
            utilisateurs
        });
    } catch (error) {
        console.error("❌ Erreur récupération service:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// Mettre à jour un service
exports.updateService = async (req, res) => {
    try {
        const { nomService, description, postes, responsable } = req.body;
        
        const updateData = {};
        
        // ✅ Construction sécurisée de l'objet de mise à jour
        if (nomService) updateData.nomService = nomService.toUpperCase().trim();
        if (description !== undefined) updateData.description = description.trim();
        if (postes) updateData.postes = postes.map(p => p.toUpperCase().trim());
        if (responsable !== undefined) {
            if (responsable) {
                const responsableUser = await User.findById(responsable);
                if (!responsableUser || responsableUser.role !== "SALARIE") {
                    return res.status(400).json({ message: "Le responsable doit être un salarié existant." });
                }
            }
            updateData.responsable = responsable;
        }

        const service = await Service.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('responsable', 'nom prenom email');

        if (!service) {
            return res.status(404).json({ message: "Service non trouvé" });
        }
        
        res.status(200).json({ 
            message: "Service mis à jour avec succès", 
            service 
        });
    } catch (error) {
        console.error("❌ Erreur mise à jour service:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// ✅ NOUVEAU: Désactiver un service (soft delete)
exports.deactivateService = async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { actif: false },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service non trouvé" });
        }

        // ✅ Désassigner tous les utilisateurs de ce service
        await User.updateMany(
            { service: req.params.id },
            { $unset: { service: "", poste: "" } }
        );

        res.status(200).json({ 
            message: "Service désactivé avec succès. Tous les utilisateurs ont été désassignés." 
        });
    } catch (error) {
        console.error("❌ Erreur désactivation service:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// ✅ NOUVEAU: Réactiver un service
exports.activateService = async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { actif: true },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ message: "Service non trouvé" });
        }

        res.status(200).json({ 
            message: "Service réactivé avec succès" 
        });
    } catch (error) {
        console.error("❌ Erreur activation service:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// Assigner un utilisateur à un service
exports.assignUserToService = async (req, res) => {
    try {
        const { serviceId, userId } = req.params;
        const { poste } = req.body;

        if (!poste) {
            return res.status(400).json({ message: "Le poste est obligatoire." });
        }

        const service = await Service.findById(serviceId);
        if (!service || !service.actif) {
            return res.status(404).json({ message: "Service non trouvé ou inactif" });
        }

        // ✅ Vérification que le poste existe dans le service
        if (!service.postes.includes(poste.toUpperCase())) {
            return res.status(400).json({ 
                message: "Ce poste n'existe pas dans ce service.",
                postesDisponibles: service.postes 
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { 
                service: serviceId, 
                poste: poste.toUpperCase().trim() 
            },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json({ 
            message: "Utilisateur assigné au service avec succès", 
            user 
        });
    } catch (error) {
        console.error("❌ Erreur assignation utilisateur:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// Retirer un utilisateur d'un service
exports.removeUserFromService = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { $unset: { service: "", poste: "" } },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json({ 
            message: "Utilisateur retiré du service avec succès", 
            user 
        });
    } catch (error) {
        console.error("❌ Erreur retrait utilisateur:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};

// ✅ NOUVEAU: Récupérer les utilisateurs d'un service
exports.getServiceUsers = async (req, res) => {
    try {
        const { serviceId } = req.params;
        
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: "Service non trouvé" });
        }

        const utilisateurs = await User.find({ 
            service: serviceId,
            actif: true 
        }).select('nom prenom email role poste dateEmbauche')
          .sort({ nom: 1, prenom: 1 });

        res.status(200).json({
            service: service.nomService,
            utilisateurs
        });
    } catch (error) {
        console.error("❌ Erreur récupération utilisateurs service:", error);
        res.status(500).json({ 
            message: "Erreur serveur", 
            error: error.message 
        });
    }
};