-- Migration pour ajouter toutes les colonnes manquantes à la table missions
-- Cette migration corrige l'erreur P2022 "The column (not available) does not exist"

-- Colonnes manquantes de base
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- Vérifier et ajouter toutes les autres colonnes qui pourraient manquer
-- (basé sur le schéma Prisma complet)

-- Colonnes de dates
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "dateAssignation" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dateLimiteProposition" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dateAcceptation" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "datePriseEnCharge" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dateDebut" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dateFin" TIMESTAMP(3);

-- Colonnes de base de la mission
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "titre" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "serviceType" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "lieu" TEXT,
ADD COLUMN IF NOT EXISTS "urgence" TEXT NOT NULL DEFAULT 'normale',
ADD COLUMN IF NOT EXISTS "budget" INTEGER;

-- Colonnes de tarification
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "tarifPrestataire" INTEGER,
ADD COLUMN IF NOT EXISTS "commissionICD" INTEGER,
ADD COLUMN IF NOT EXISTS "commissionHybride" INTEGER,
ADD COLUMN IF NOT EXISTS "commissionRisk" INTEGER,
ADD COLUMN IF NOT EXISTS "commissionTotale" INTEGER,
ADD COLUMN IF NOT EXISTS "fraisSupplementaires" INTEGER,
ADD COLUMN IF NOT EXISTS "tarifTotal" INTEGER;

-- Colonnes JSON
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "paiementEchelonne" JSONB,
ADD COLUMN IF NOT EXISTS "sharedFiles" JSONB,
ADD COLUMN IF NOT EXISTS "progress" JSONB,
ADD COLUMN IF NOT EXISTS "currentProgress" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "phases" JSONB,
ADD COLUMN IF NOT EXISTS "delaiMaximal" INTEGER,
ADD COLUMN IF NOT EXISTS "dateLimiteMission" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "updates" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "messages" JSONB,
ADD COLUMN IF NOT EXISTS "estimationPartenaire" JSONB;

-- Colonnes de notes et commentaires
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "noteClient" INTEGER,
ADD COLUMN IF NOT EXISTS "notePrestataire" INTEGER,
ADD COLUMN IF NOT EXISTS "noteICD" INTEGER,
ADD COLUMN IF NOT EXISTS "noteAdminPourPrestataire" INTEGER,
ADD COLUMN IF NOT EXISTS "commentaireClient" TEXT,
ADD COLUMN IF NOT EXISTS "commentairePrestataire" TEXT,
ADD COLUMN IF NOT EXISTS "commentaireICD" TEXT,
ADD COLUMN IF NOT EXISTS "commentaireAdminPourPrestataire" TEXT;

-- Colonnes de preuves
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "proofs" JSONB,
ADD COLUMN IF NOT EXISTS "proofSubmissionDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "proofValidatedByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "proofValidatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "proofValidatedForClient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "proofValidatedForClientAt" TIMESTAMP(3);

-- Colonnes de fermeture
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "closedBy" TEXT,
ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);

-- Colonnes de paiement et devis
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "devisGenere" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "devisGenereAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "paiementEffectue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "paiementEffectueAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "avanceVersee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "avanceVerseeAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "avancePercentage" INTEGER,
ADD COLUMN IF NOT EXISTS "soldeVersee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "soldeVerseeAt" TIMESTAMP(3);

-- Colonnes d'archivage
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "archivedBy" TEXT;

-- Colonnes de suppression
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;

-- Colonnes de workflow interne
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "internalState" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "notifiedProviderAt" TIMESTAMP(3);

-- Colonnes de référence
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "prestataireRef" TEXT;

-- S'assurer que les colonnes NOT NULL ont des valeurs par défaut pour les enregistrements existants
UPDATE "missions" 
SET 
  "titre" = COALESCE("titre", ''),
  "description" = COALESCE("description", ''),
  "serviceType" = COALESCE("serviceType", ''),
  "urgence" = COALESCE("urgence", 'normale'),
  "internalState" = COALESCE("internalState", 'pending'),
  "status" = COALESCE("status", 'pending')
WHERE 
  "titre" IS NULL 
  OR "description" IS NULL 
  OR "serviceType" IS NULL 
  OR "urgence" IS NULL
  OR "internalState" IS NULL
  OR "status" IS NULL;

