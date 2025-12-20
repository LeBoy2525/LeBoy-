-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "verificationCodeExpires" TIMESTAMP(3),
    "country" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateTable
CREATE TABLE IF NOT EXISTS "demandes" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceSubcategory" TEXT,
    "serviceAutre" TEXT,
    "country" TEXT,
    "description" TEXT NOT NULL,
    "lieu" TEXT,
    "budget" TEXT,
    "urgence" TEXT NOT NULL,
    "fileIds" TEXT[],
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "rejeteeAt" TIMESTAMP(3),
    "rejeteeBy" TEXT,
    "raisonRejet" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "demandes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "demandes_ref_key" ON "demandes"("ref");

-- CreateTable
CREATE TABLE IF NOT EXISTS "prestataires" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nomEntreprise" TEXT NOT NULL,
    "nomContact" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "specialites" TEXT[],
    "zonesIntervention" TEXT[],
    "passwordHash" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "actifAt" TIMESTAMP(3),
    "suspenduAt" TIMESTAMP(3),
    "rejeteAt" TIMESTAMP(3),
    "rejeteBy" TEXT,
    "raisonRejet" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "prestataires_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "prestataires_ref_key" ON "prestataires"("ref");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "prestataires_email_key" ON "prestataires"("email");

-- CreateTable
CREATE TABLE IF NOT EXISTS "missions" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "prestataireId" TEXT,
    "prestataireRef" TEXT,
    "internalState" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateAssignation" TIMESTAMP(3),
    "dateLimiteProposition" TIMESTAMP(3),
    "dateAcceptation" TIMESTAMP(3),
    "datePriseEnCharge" TIMESTAMP(3),
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "lieu" TEXT,
    "urgence" TEXT NOT NULL,
    "budget" INTEGER,
    "tarifPrestataire" INTEGER,
    "commissionICD" INTEGER,
    "commissionHybride" INTEGER,
    "commissionRisk" INTEGER,
    "commissionTotale" INTEGER,
    "fraisSupplementaires" INTEGER,
    "tarifTotal" INTEGER,
    "paiementEchelonne" JSONB,
    "sharedFiles" JSONB,
    "progress" JSONB,
    "currentProgress" INTEGER DEFAULT 0,
    "phases" JSONB,
    "delaiMaximal" INTEGER,
    "dateLimiteMission" TIMESTAMP(3),
    "updates" JSONB DEFAULT '[]',
    "messages" JSONB,
    "noteClient" INTEGER,
    "notePrestataire" INTEGER,
    "noteICD" INTEGER,
    "noteAdminPourPrestataire" INTEGER,
    "commentaireClient" TEXT,
    "commentairePrestataire" TEXT,
    "commentaireICD" TEXT,
    "commentaireAdminPourPrestataire" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "missions_ref_key" ON "missions"("ref");

-- CreateTable
CREATE TABLE IF NOT EXISTS "propositions" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "prestataireId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "delai" TEXT NOT NULL,
    "message" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,

    CONSTRAINT "propositions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "propositions_ref_key" ON "propositions"("ref");

-- CreateTable
CREATE TABLE IF NOT EXISTS "files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "storageUrl" TEXT,
    "filePath" TEXT,
    "demandeId" TEXT,
    "missionId" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

