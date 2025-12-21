-- Ajouter les colonnes manquantes à la table missions
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "proofs" JSONB,
ADD COLUMN IF NOT EXISTS "proofSubmissionDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "proofValidatedByAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "proofValidatedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "proofValidatedForClient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "proofValidatedForClientAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "closedBy" TEXT,
ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "devisGenere" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "devisGenereAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "paiementEffectue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "paiementEffectueAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "avanceVersee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "avanceVerseeAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "avancePercentage" INTEGER,
ADD COLUMN IF NOT EXISTS "soldeVersee" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "soldeVerseeAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "estimationPartenaire" JSONB,
ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "archivedBy" TEXT,
ADD COLUMN IF NOT EXISTS "deleted" BOOLEAN NOT NULL DEFAULT false;

-- Ajouter les index manquants
CREATE INDEX IF NOT EXISTS "missions_demandeId_idx" ON "missions"("demandeId");
CREATE INDEX IF NOT EXISTS "missions_prestataireId_idx" ON "missions"("prestataireId");
CREATE INDEX IF NOT EXISTS "missions_clientEmail_idx" ON "missions"("clientEmail");
CREATE INDEX IF NOT EXISTS "missions_internalState_idx" ON "missions"("internalState");

-- Corriger la table propositions pour correspondre au schéma Prisma
ALTER TABLE "propositions"
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "prix_prestataire" INTEGER,
ADD COLUMN IF NOT EXISTS "delai_estime" INTEGER,
ADD COLUMN IF NOT EXISTS "commentaire" TEXT,
ADD COLUMN IF NOT EXISTS "difficulte_estimee" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS "accepteeAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "refuseeAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "accepteeBy" TEXT,
ADD COLUMN IF NOT EXISTS "refuseeBy" TEXT,
ADD COLUMN IF NOT EXISTS "raisonRefus" TEXT,
ADD COLUMN IF NOT EXISTS "missionId" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migrer les données existantes si nécessaire
-- Si montant existe mais pas prix_prestataire, copier montant vers prix_prestataire
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propositions' AND column_name = 'montant') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propositions' AND column_name = 'prix_prestataire') THEN
        UPDATE "propositions" SET "prix_prestataire" = CAST("montant" AS INTEGER) WHERE "prix_prestataire" IS NULL;
    END IF;
END $$;

-- Si delai existe mais pas delai_estime, copier delai vers delai_estime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propositions' AND column_name = 'delai') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propositions' AND column_name = 'delai_estime') THEN
        UPDATE "propositions" SET "delai_estime" = CAST("delai" AS INTEGER) WHERE "delai_estime" IS NULL;
    END IF;
END $$;

-- Si message existe mais pas commentaire, copier message vers commentaire
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propositions' AND column_name = 'message') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'propositions' AND column_name = 'commentaire') THEN
        UPDATE "propositions" SET "commentaire" = "message" WHERE "commentaire" IS NULL;
    END IF;
END $$;

-- Ajouter les index pour propositions
CREATE INDEX IF NOT EXISTS "propositions_demandeId_idx" ON "propositions"("demandeId");
CREATE INDEX IF NOT EXISTS "propositions_prestataireId_idx" ON "propositions"("prestataireId");

-- Ajouter les contraintes de clés étrangères si elles n'existent pas
DO $$
BEGIN
    -- Clé étrangère missions -> demandes
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'missions_demandeId_fkey'
    ) THEN
        ALTER TABLE "missions" 
        ADD CONSTRAINT "missions_demandeId_fkey" 
        FOREIGN KEY ("demandeId") REFERENCES "demandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Clé étrangère missions -> prestataires
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'missions_prestataireId_fkey'
    ) THEN
        ALTER TABLE "missions" 
        ADD CONSTRAINT "missions_prestataireId_fkey" 
        FOREIGN KEY ("prestataireId") REFERENCES "prestataires"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Clé étrangère propositions -> demandes
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'propositions_demandeId_fkey'
    ) THEN
        ALTER TABLE "propositions" 
        ADD CONSTRAINT "propositions_demandeId_fkey" 
        FOREIGN KEY ("demandeId") REFERENCES "demandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Clé étrangère propositions -> prestataires
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'propositions_prestataireId_fkey'
    ) THEN
        ALTER TABLE "propositions" 
        ADD CONSTRAINT "propositions_prestataireId_fkey" 
        FOREIGN KEY ("prestataireId") REFERENCES "prestataires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

