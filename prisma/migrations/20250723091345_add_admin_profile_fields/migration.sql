-- AlterTable
ALTER TABLE "admins" ADD COLUMN "username" TEXT NOT NULL DEFAULT '',
                     ADD COLUMN "profileImage" TEXT,
                     ADD COLUMN "mobileNumber" TEXT,
                     ADD COLUMN "lastKnownIp" TEXT,
                     ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username"); 