
export type UserRole = "client" | "admin" | "prestataire";

// États internes du mandat (workflow simplifié)
export type MissionInternalState =
  | "CREATED" // 1. Demande déposée par le client, en attente de traitement par l'admin
  | "ASSIGNED_TO_PROVIDER" // 2. Mandat assigné à un prestataire, en attente d'estimation
  | "PROVIDER_ESTIMATED" // 3. Prestataire a accepté la mission et soumis son estimation
  | "WAITING_CLIENT_PAYMENT" // 4. Devis validé par l'admin et envoyé au client, en attente de paiement
  | "PAID_WAITING_TAKEOVER" // 5. Client a payé, en attente que l'admin envoie l'avance au prestataire
  | "ADVANCE_SENT" // 6. 50% envoyés au prestataire, en attente que le prestataire clique sur "Prise en charge"
  | "IN_PROGRESS" // 7. Mission en cours d'exécution par le prestataire
  | "PROVIDER_VALIDATION_SUBMITTED" // 8. Prestataire a fini et soumis les preuves pour validation
  | "ADMIN_CONFIRMED" // 9. Admin a validé la conformité et confirmé le paiement du solde
  | "COMPLETED"; // 10. Mission clôturée côté client, rapport final disponible

export type MissionStatus = 
  | "en_analyse_quebec" // Statut initial - En analyse (Québec)
  | "en_evaluation_partenaire" // En évaluation (Partenaire)
  | "evaluation_recue_quebec" // Évaluation reçue (Québec)
  | "en_attente_paiement_client" // En attente de paiement (Client)
  | "paye_en_attente_demarrage" // Payé – En attente de démarrage
  | "avance_versee_partenaire" // Avance versée (Partenaire)
  | "en_cours_partenaire" // En cours (Partenaire)
  | "en_validation_quebec" // En validation (Québec)
  | "termine_icd_canada" // Terminé (LeBoy Canada)
  | "cloture" // Clôturé
  | "annulee"; // Mission annulée

// Statut simplifié pour le client (mapping automatique)
export type ClientMissionStatus = 
  | "en_analyse" // En analyse
  | "en_evaluation" // En évaluation
  | "en_attente_paiement" // En attente de paiement
  | "en_cours" // En cours
  | "termine" // Terminé
  | "annulee"; // Annulée

export type MissionUpdateType = 
  | "status_change"
  | "photo"
  | "document"
  | "note"
  | "message";

export interface MissionUpdate {
  id: number;
  missionId: number;
  type: MissionUpdateType;
  author: "admin" | "prestataire" | "client";
  authorEmail: string;
  content: string;
  fileUrl?: string;
  createdAt: string;
}

export interface SharedFile {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  sharedAt: string; // ISO date
  sharedBy: string; // Email de l'admin
}

export interface MissionProgress {
  etape: string; // "acceptation" | "prise_en_charge" | "en_cours" | "validation" | "terminee"
  pourcentage: number; // 0-100
  date?: string; // ISO date
  commentaire?: string;
  retard?: boolean; // Si l'étape est en retard
  dateLimite?: string; // ISO date limite pour cette étape
}

export interface ExecutionPhase {
  id: string;
  nom: string;
  description?: string;
  completed: boolean;
  completedAt?: string; // ISO date
  dateLimite?: string; // ISO date limite pour cette phase
  retard?: boolean;
  noteRetard?: string; // Note expliquant le retard (visible par l'admin)
  ordre: number; // Ordre d'exécution
}

export interface Message {
  id: string;
  missionId: number;
  from: "client" | "prestataire" | "admin";
  fromEmail: string;
  to: "client" | "prestataire" | "admin";
  toEmail: string;
  content: string;
  type: "chat" | "email"; // Type de message
  createdAt: string; // ISO date
  lu?: boolean; // Si le message a été lu
}

export interface MissionProof {
  id: string;
  fileId: string; // Référence au fichier dans filesStore
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string; // URL publique du fichier (Blob ou API)
  uploadedAt: string; // ISO date
  uploadedBy: string; // Email du prestataire
  description?: string; // Description optionnelle de la preuve
  validatedByAdmin?: boolean; // Si l'admin a validé cette preuve
  validatedAt?: string; // Date de validation par l'admin
  archivedAt?: string; // Date d'archivage (3 mois après validation)
}

export interface Mission {
  id: number;
  ref: string; // M-2025-001
  demandeId: number; // Référence à la demande originale
  clientEmail: string;
  prestataireId?: number | null;
  prestataireRef?: string | null;
  
  // État interne du workflow (source de vérité)
  internalState: MissionInternalState;
  // Statut d'affichage (dérivé de internalState pour compatibilité)
  status: MissionStatus;
  createdAt: string;
  dateAssignation?: string;
  dateLimiteProposition?: string; // Date limite pour soumettre une proposition (24h après assignation)
  dateAcceptation?: string;
  datePriseEnCharge?: string; // Date de prise en charge
  dateDebut?: string;
  dateFin?: string;
  
  // Informations de la mission
  titre: string;
  description: string;
  serviceType: string;
  lieu?: string;
  urgence: string;
  budget?: number;
  
  // Tarification (définie après estimation partenaire et génération devis)
  tarifPrestataire?: number; // Défini par le partenaire lors de son estimation
  commissionICD?: number; // DEPRECATED - Utiliser commissionTotale à la place
  commissionHybride?: number; // Commission de base LeBoy (revenu réel) en FCFA
  commissionRisk?: number; // Fonds de protection LeBoy en FCFA
  commissionTotale?: number; // Commission totale = commissionHybride + commissionRisk
  fraisSupplementaires?: number; // Frais supplémentaires en FCFA (optionnel, défini lors de la génération du devis)
  tarifTotal?: number; // Prix total client TTC = tarifPrestataire + commissionTotale + fraisSupplementaires
  
  // Paiement échelonné
  paiementEchelonne?: {
    type: "total" | "echelonne"; // Type de paiement choisi
    plan?: "50-50" | "30-30-40"; // Plan de paiement choisi
    nombreTranches?: number; // Nombre de tranches si échelonné (2 ou 3)
    tauxInteret?: number; // Taux d'intérêt annuel en % (ex: 5 pour 5%)
    montantsParTranche?: number[]; // Montants à payer par tranche (tableau, calculé avec intérêts)
    pourcentagesParTranche?: number[]; // Pourcentages de chaque tranche (ex: [50, 50] ou [30, 30, 40])
    datesEcheances?: string[]; // Dates d'échéance pour chaque tranche (ISO dates)
    totalAvecInterets?: number; // Montant total avec intérêts si échelonné
  };
  
  // Fichiers partagés avec le prestataire
  sharedFiles?: SharedFile[];
  
  // Suivi et progression
  progress?: MissionProgress[]; // Historique de progression
  currentProgress?: number; // Pourcentage actuel (0-100)
  
  // Phases d'exécution
  phases?: ExecutionPhase[]; // Phases d'exécution définies par le prestataire
  delaiMaximal?: number; // Délai maximal en heures (ex: 48 pour 48h)
  dateLimiteMission?: string; // Date limite calculée à partir du délai maximal
  
  // Suivi
  updates: MissionUpdate[];
  
  // Messages/Chat
  messages?: Message[];
  
  // Notes et évaluations
  noteClient?: number; // 1-5 (déprécié, utiliser noteICD)
  notePrestataire?: number; // 1-5 (note du client pour le prestataire - déprécié)
  noteICD?: number; // 1-5 (note du client pour LeBoy)
  noteAdminPourPrestataire?: number; // 1-5 (note de l'admin pour le prestataire)
  commentaireClient?: string;
  commentairePrestataire?: string;
  commentaireICD?: string; // Commentaire du client pour LeBoy
  commentaireAdminPourPrestataire?: string; // Commentaire de l'admin pour le prestataire
  
  // Preuves de validation finale
  proofs?: MissionProof[]; // Preuves uploadées par le prestataire
  proofSubmissionDate?: string; // Date de soumission des preuves
  proofValidatedByAdmin?: boolean; // Si l'admin a validé les preuves
  proofValidatedAt?: string; // Date de validation par l'admin
  proofValidatedForClient?: boolean; // Si le client peut voir les preuves
  proofValidatedForClientAt?: string; // Date à laquelle les preuves ont été validées pour le client (pour calculer les 24h)
  
  // Fermeture de la mission
  closedBy?: "client" | "admin" | "auto"; // Qui a fermé la mission
  closedAt?: string; // Date de fermeture de la mission
  
  // Paiement et devis
  devisGenere?: boolean; // Si le devis a été généré
  devisGenereAt?: string; // Date de génération du devis
  paiementEffectue?: boolean; // Si le paiement client a été effectué
  paiementEffectueAt?: string; // Date du paiement client
  avanceVersee?: boolean; // Si l'avance partenaire a été versée
  avanceVerseeAt?: string; // Date de versement de l'avance
  avancePercentage?: number; // Pourcentage d'avance versé (25 ou 50)
  soldeVersee?: boolean; // Si le solde partenaire a été versé
  soldeVerseeAt?: string; // Date de versement du solde
  
  // Estimation partenaire
  estimationPartenaire?: {
    prixFournisseur: number;
    delaisEstimes: number; // en heures
    noteExplication?: string;
    fraisExternes?: number;
    soumiseAt?: string;
  };
  
  // Archivage/Suppression
  archived?: boolean; // Si la mission est archivée
  archivedAt?: string; // Date d'archivage
  archivedBy?: "client" | "prestataire" | "admin"; // Qui a archivé
  deleted?: boolean; // Si la mission est supprimée (soft delete)
  deletedAt?: string; // Date de suppression
  deletedBy?: "client" | "prestataire" | "admin"; // Qui a supprimé
}

// Fonction utilitaire pour mapper l'état interne vers le statut d'affichage
export function mapInternalStateToStatus(internalState: MissionInternalState): MissionStatus {
  switch (internalState) {
    case "CREATED":
      return "en_analyse_quebec";
    case "ASSIGNED_TO_PROVIDER":
      return "en_evaluation_partenaire";
    case "PROVIDER_ESTIMATED":
      return "evaluation_recue_quebec";
    case "WAITING_CLIENT_PAYMENT":
      return "en_attente_paiement_client";
    case "PAID_WAITING_TAKEOVER":
      return "paye_en_attente_demarrage";
    case "ADVANCE_SENT":
      return "avance_versee_partenaire";
    case "IN_PROGRESS":
      return "en_cours_partenaire";
    case "PROVIDER_VALIDATION_SUBMITTED":
      return "en_validation_quebec";
    case "ADMIN_CONFIRMED":
      return "termine_icd_canada";
    case "COMPLETED":
      return "cloture";
    default:
      return "en_analyse_quebec";
  }
}

// Fonction utilitaire pour obtenir le pourcentage de progression basé sur l'état interne
export function getProgressFromInternalState(internalState: MissionInternalState): number {
  switch (internalState) {
    case "CREATED":
      return 5;
    case "ASSIGNED_TO_PROVIDER":
      return 10;
    case "PROVIDER_ESTIMATED":
      return 20;
    case "WAITING_CLIENT_PAYMENT":
      return 30;
    case "PAID_WAITING_TAKEOVER":
      return 40;
    case "ADVANCE_SENT":
      return 45;
    case "IN_PROGRESS":
      return 50;
    case "PROVIDER_VALIDATION_SUBMITTED":
      return 80;
    case "ADMIN_CONFIRMED":
      return 95;
    case "COMPLETED":
      return 100;
    default:
      return 0;
  }
}

// Fonction utilitaire pour obtenir l'étape de la barre de progression basée sur l'état interne
export type ProgressStepKey = "acceptation" | "prise_en_charge" | "en_cours" | "validation" | "terminee";

export function getProgressStepFromInternalState(internalState: MissionInternalState): ProgressStepKey | null {
  switch (internalState) {
    case "CREATED":
    case "ASSIGNED_TO_PROVIDER":
      return "acceptation";
    case "PROVIDER_ESTIMATED":
    case "WAITING_CLIENT_PAYMENT":
    case "PAID_WAITING_TAKEOVER":
    case "ADVANCE_SENT":
      return "prise_en_charge";
    case "IN_PROGRESS":
      return "en_cours";
    case "PROVIDER_VALIDATION_SUBMITTED":
    case "ADMIN_CONFIRMED":
      return "validation";
    case "COMPLETED":
      return "terminee";
    default:
      return null;
  }
}

// Fonction utilitaire pour mapper les statuts admin vers statuts client
export function mapStatusToClient(status: MissionStatus): ClientMissionStatus {
  switch (status) {
    case "en_analyse_quebec":
      return "en_analyse";
    case "en_evaluation_partenaire":
    case "evaluation_recue_quebec":
      return "en_evaluation";
    case "en_attente_paiement_client":
      return "en_attente_paiement";
    case "paye_en_attente_demarrage":
    case "avance_versee_partenaire":
    case "en_cours_partenaire":
    case "en_validation_quebec":
      return "en_cours";
    case "termine_icd_canada":
    case "cloture":
      return "termine";
    case "annulee":
      return "annulee";
    default:
      return "en_analyse";
  }
}

