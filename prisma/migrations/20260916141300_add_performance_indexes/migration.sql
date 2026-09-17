-- CreateIndex
CREATE INDEX `Request_status_idx` ON `Request`(`status`);

-- CreateIndex
CREATE INDEX `Request_tglMulai_idx` ON `Request`(`tglMulai`);

-- CreateIndex
CREATE INDEX `Request_noForm_idx` ON `Request`(`noForm`);

-- CreateIndex
CREATE INDEX `Request_driverId_idx` ON `Request`(`driverId`);

-- CreateIndex
CREATE INDEX `Request_kendaraanId_idx` ON `Request`(`kendaraanId`);

-- CreateIndex
CREATE INDEX `RoutineRequest_status_idx` ON `RoutineRequest`(`status`);

-- CreateIndex
CREATE INDEX `RoutineRequest_startDate_idx` ON `RoutineRequest`(`startDate`);

-- CreateIndex
CREATE INDEX `RoutineRequest_noForm_idx` ON `RoutineRequest`(`noForm`);
