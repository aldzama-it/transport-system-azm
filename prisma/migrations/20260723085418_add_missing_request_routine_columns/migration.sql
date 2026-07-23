-- Add columns that exist in Prisma schema but were missing from earlier migrations.
ALTER TABLE `Request`
    ADD COLUMN `titikJemput` TEXT NULL;

ALTER TABLE `RoutineRequest`
    ADD COLUMN `noForm` VARCHAR(191) NULL,
    ADD COLUMN `buktiFileUrl` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `RoutineRequest_noForm_key` ON `RoutineRequest`(`noForm`);
