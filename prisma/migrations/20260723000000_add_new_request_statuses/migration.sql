-- AlterTable
ALTER TABLE `Request` MODIFY `status` ENUM('pending', 'granted', 'waiting_assignment', 'assigned', 'in_progress', 'deny', 'cancelled', 'done') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `RequestHistory` MODIFY `status` ENUM('pending', 'granted', 'waiting_assignment', 'assigned', 'in_progress', 'deny', 'cancelled', 'done') NOT NULL;
