-- CreateTable
CREATE TABLE `RoutineRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `requester` VARCHAR(191) NOT NULL,
    `divisi` VARCHAR(191) NOT NULL,
    `project` VARCHAR(191) NULL,
    `pickup` TEXT NULL,
    `destination` TEXT NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `departureTime` VARCHAR(191) NOT NULL,
    `returnTime` VARCHAR(191) NOT NULL,
    `repeatType` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `status` ENUM('pending', 'active', 'paused', 'completed', 'cancelled', 'deny') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Request` ADD COLUMN `routineRequestId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_routineRequestId_fkey` FOREIGN KEY (`routineRequestId`) REFERENCES `RoutineRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
