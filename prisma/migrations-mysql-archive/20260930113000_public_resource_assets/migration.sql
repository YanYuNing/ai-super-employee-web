-- Stage 06.6.7: public resource files and stable asset delivery. Incremental only.
SET NAMES utf8mb4;
SET @db := DATABASE();
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='resources' AND column_name='fileAssetId')=0,'ALTER TABLE `resources` ADD COLUMN `fileAssetId` INT NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='resources' AND index_name='resources_fileAssetId_idx')=0,'CREATE INDEX `resources_fileAssetId_idx` ON `resources` (`fileAssetId`)','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='resources' AND constraint_name='resources_fileAssetId_fkey')=0,'ALTER TABLE `resources` ADD CONSTRAINT `resources_fileAssetId_fkey` FOREIGN KEY (`fileAssetId`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
