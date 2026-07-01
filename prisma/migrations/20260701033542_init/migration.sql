-- CreateTable
CREATE TABLE `StaffAkun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('koordinator', 'staff') NOT NULL DEFAULT 'staff',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StaffAkun_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Driver` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `telepon` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'aktif',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kendaraan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jenis` VARCHAR(191) NOT NULL,
    `nopol` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'tersedia',

    UNIQUE INDEX `Kendaraan_nopol_key`(`nopol`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Request` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `noForm` VARCHAR(191) NOT NULL,
    `namaPemohon` VARCHAR(191) NOT NULL,
    `divisi` VARCHAR(191) NOT NULL,
    `tujuan` TEXT NOT NULL,
    `tglMulai` DATETIME(3) NOT NULL,
    `tglSelesai` DATETIME(3) NOT NULL,
    `status` ENUM('pending', 'granted', 'deny', 'cancelled', 'done') NOT NULL DEFAULT 'pending',
    `driverId` INTEGER NULL,
    `kendaraanId` INTEGER NULL,
    `buktiFileUrl` VARCHAR(191) NULL,
    `alasanDeny` TEXT NULL,
    `alasanCancel` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Request_noForm_key`(`noForm`),
    INDEX `Request_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RequestHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestId` INTEGER NOT NULL,
    `staffId` INTEGER NULL,
    `status` ENUM('pending', 'granted', 'deny', 'cancelled', 'done') NOT NULL,
    `catatan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `Driver`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_kendaraanId_fkey` FOREIGN KEY (`kendaraanId`) REFERENCES `Kendaraan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RequestHistory` ADD CONSTRAINT `RequestHistory_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `Request`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RequestHistory` ADD CONSTRAINT `RequestHistory_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `StaffAkun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
