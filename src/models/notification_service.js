// models/notification_service.js
const Contrat = require("./contrat_model");

class ContratNotificationService {
  
  // 🔹 Récupérer les contrats arrivant à expiration avec détails
  static async getExpiringContratsDetails() {
    try {
      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0); // Reset à minuit pour la comparaison
      
      // Calculer les dates limites
      const dans7Jours = new Date(aujourdhui);
      dans7Jours.setDate(aujourdhui.getDate() + 7);
      
      const dans15Jours = new Date(aujourdhui);
      dans15Jours.setDate(aujourdhui.getDate() + 15);
      
      const dans30Jours = new Date(aujourdhui);
      dans30Jours.setDate(aujourdhui.getDate() + 30);

      console.log(`🔍 Recherche contrats expirants entre ${aujourdhui.toLocaleDateString()} et ${dans30Jours.toLocaleDateString()}`);

      // Récupérer tous les contrats actifs avec date de fin dans les 30 prochains jours
      const contratsActifs = await Contrat.find({
        statut: "Actif",
        dateFin: { 
          $exists: true, 
          $ne: null,
          $gte: aujourdhui,
          $lte: dans30Jours
        }
      })
      .populate("user", "nom prenom email matricule")
      .populate("service", "nomService");

      console.log(`📊 ${contratsActifs.length} contrat(s) actif(s) trouvé(s) dans la période`);

      // Classer les contrats par période d'expiration
      const contratsExpirants = {
        dans7Jours: [],
        dans15Jours: [],
        dans30Jours: []
      };

      contratsActifs.forEach(contrat => {
        const dateFin = new Date(contrat.dateFin);
        dateFin.setHours(0, 0, 0, 0); // Reset à minuit
        
        const joursRestants = Math.ceil((dateFin - aujourdhui) / (1000 * 60 * 60 * 24));
        
        console.log(`📅 Contrat ${contrat._id}: ${joursRestants} jours restants`);

        const contratDetails = {
          contratId: contrat._id,
          user: `${contrat.user.nom} ${contrat.user.prenom}`,
          userMatricule: contrat.user.matricule || "N/A",
          typeContrat: contrat.typeContrat,
          service: contrat.service?.nomService || "Non assigné",
          dateFin: contrat.dateFin,
          joursRestants: joursRestants,
          salaire: contrat.salaire,
          poste: contrat.poste,
          dateDebut: contrat.dateDebut
        };

        if (joursRestants <= 7) {
          contratsExpirants.dans7Jours.push(contratDetails);
          console.log(`🚨 URGENT: ${contratDetails.user} - ${joursRestants} jours`);
        } else if (joursRestants <= 15) {
          contratsExpirants.dans15Jours.push(contratDetails);
          console.log(`⚠️ RAPPEL: ${contratDetails.user} - ${joursRestants} jours`);
        } else if (joursRestants <= 30) {
          contratsExpirants.dans30Jours.push(contratDetails);
          console.log(`📅 INFO: ${contratDetails.user} - ${joursRestants} jours`);
        }
      });

      // Trier par jours restants (croissant)
      contratsExpirants.dans7Jours.sort((a, b) => a.joursRestants - b.joursRestants);
      contratsExpirants.dans15Jours.sort((a, b) => a.joursRestants - b.joursRestants);
      contratsExpirants.dans30Jours.sort((a, b) => a.joursRestants - b.joursRestants);

      console.log(`📈 Résultats: 7j:${contratsExpirants.dans7Jours.length}, 15j:${contratsExpirants.dans15Jours.length}, 30j:${contratsExpirants.dans30Jours.length}`);

      return contratsExpirants;

    } catch (error) {
      console.error("❌ Erreur récupération contrats expirants:", error);
      throw error;
    }
  }

  // 🔹 Obtenir les statistiques d'expiration
  static async getContratExpirationStats() {
    try {
      const contratsExpirants = await this.getExpiringContratsDetails();
      
      const stats = {
        expiresDans7Jours: contratsExpirants.dans7Jours.length,
        expiresDans15Jours: contratsExpirants.dans15Jours.length,
        expiresDans30Jours: contratsExpirants.dans30Jours.length,
        totalExpirant: contratsExpirants.dans7Jours.length + 
                      contratsExpirants.dans15Jours.length + 
                      contratsExpirants.dans30Jours.length
      };

      console.log(`📊 Statistiques expiration:`, stats);
      
      return stats;
    } catch (error) {
      console.error("❌ Erreur calcul statistiques expiration:", error);
      throw error;
    }
  }

  // 🔹 Vérifier et créer des notifications d'expiration
  static async checkAndCreateExpirationNotifications() {
    try {
      const contratsExpirants = await this.getExpiringContratsDetails();
      const notificationsCreated = [];

      // Créer des notifications pour les contrats dans 7 jours
      for (const contrat of contratsExpirants.dans7Jours) {
        const notification = await this.createExpirationNotification(
          contrat.contratId, 
          'URGENT', 
          `Contrat de ${contrat.user} expire dans ${contrat.joursRestants} jour(s)`
        );
        if (notification) notificationsCreated.push(notification);
      }

      // Créer des notifications pour les contrats dans 15 jours
      for (const contrat of contratsExpirants.dans15Jours) {
        const notification = await this.createExpirationNotification(
          contrat.contratId, 
          'WARNING', 
          `Contrat de ${contrat.user} expire dans ${contrat.joursRestants} jour(s)`
        );
        if (notification) notificationsCreated.push(notification);
      }

      // Créer des notifications pour les contrats dans 30 jours
      for (const contrat of contratsExpirants.dans30Jours) {
        const notification = await this.createExpirationNotification(
          contrat.contratId, 
          'INFO', 
          `Contrat de ${contrat.user} expire dans ${contrat.joursRestants} jour(s)`
        );
        if (notification) notificationsCreated.push(notification);
      }

      console.log(`🔔 ${notificationsCreated.length} notification(s) créée(s)`);
      return notificationsCreated;

    } catch (error) {
      console.error("❌ Erreur création notifications expiration:", error);
      throw error;
    }
  }

  // 🔹 Créer une notification d'expiration
  static async createExpirationNotification(contratId, niveau, message) {
    try {
      // Simulation de création de notification
      // Vous pouvez intégrer avec votre modèle Notification ici
      return {
        _id: new Date().getTime(), // ID temporaire
        contratId,
        niveau,
        message,
        dateCreation: new Date(),
        lue: false
      };
    } catch (error) {
      console.error("❌ Erreur création notification:", error);
      return null;
    }
  }

  // 🔹 Créer une notification pour l'admin
  static async createAdminExpirationNotification(adminUserId) {
    try {
      const stats = await this.getContratExpirationStats();
      
      if (stats.totalExpirant === 0) {
        console.log("✅ Aucun contrat n'arrive à expiration");
        return null;
      }

      let message = `${stats.totalExpirant} contrat(s) arrive(nt) à expiration :`;
      if (stats.expiresDans7Jours > 0) {
        message += ` ${stats.expiresDans7Jours} urgent(s) (7 jours),`;
      }
      if (stats.expiresDans15Jours > 0) {
        message += ` ${stats.expiresDans15Jours} rappel(s) (15 jours),`;
      }
      if (stats.expiresDans30Jours > 0) {
        message += ` ${stats.expiresDans30Jours} info(s) (30 jours)`;
      }

      const notification = {
        _id: new Date().getTime(),
        userId: adminUserId,
        type: "CONTRAT_EXPIRATION",
        titre: "Alertes Contrats",
        message: message,
        niveau: stats.expiresDans7Jours > 0 ? "URGENT" : "WARNING",
        dateCreation: new Date(),
        lue: false
      };

      console.log(`👨‍💼 Notification admin créée: ${message}`);
      return notification;

    } catch (error) {
      console.error("❌ Erreur création notification admin:", error);
      throw error;
    }
  }
}

module.exports = ContratNotificationService;