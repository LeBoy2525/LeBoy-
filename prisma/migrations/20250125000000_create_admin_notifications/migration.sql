-- CreateTable
CREATE TABLE IF NOT EXISTS "admin_notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "missionId" TEXT,
    "missionRef" TEXT,
    "demandeId" TEXT,
    "clientEmail" TEXT,
    "prestataireName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "admin_notifications_read_idx" ON "admin_notifications"("read");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "admin_notifications_createdAt_idx" ON "admin_notifications"("createdAt");

