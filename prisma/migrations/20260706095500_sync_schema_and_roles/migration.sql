-- Add fields introduced after the initial migration.
ALTER TABLE `Kendaraan`
    ADD COLUMN `lokasi` VARCHAR(191) NULL,
    ADD COLUMN `project` VARCHAR(191) NULL;

-- Imported requests may not have start and end dates.
ALTER TABLE `Request`
    MODIFY `tglMulai` DATETIME(3) NULL,
    MODIFY `tglSelesai` DATETIME(3) NULL;

-- Keep the old and new role values temporarily so existing rows can be mapped
-- without MySQL coercing removed enum values to an empty string.
ALTER TABLE `StaffAkun`
    MODIFY `role` ENUM(
        'koordinator',
        'staff',
        'admin',
        'koor_transport',
        'staff_transport'
    ) NOT NULL DEFAULT 'staff';

UPDATE `StaffAkun`
SET `role` = CASE
    WHEN `role` = 'koordinator' THEN 'koor_transport'
    WHEN `role` = 'staff' THEN 'staff_transport'
    ELSE `role`
END;

ALTER TABLE `StaffAkun`
    MODIFY `role` ENUM(
        'admin',
        'koor_transport',
        'staff_transport'
    ) NOT NULL DEFAULT 'staff_transport';
