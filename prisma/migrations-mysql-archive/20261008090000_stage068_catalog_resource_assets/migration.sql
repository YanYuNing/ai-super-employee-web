-- Add resource file asset relation and indexes; additive only.
ALTER TABLE `resources` ADD COLUMN `fileAssetId` INT NULL;
ALTER TABLE `resources` ADD COLUMN `fileName` VARCHAR(255) NULL;
ALTER TABLE `resources` ADD COLUMN `fileType` VARCHAR(100) NULL;
CREATE INDEX `resources_fileAssetId_idx` ON `resources` (`fileAssetId`);
ALTER TABLE `resources`
  ADD CONSTRAINT `resources_fileAssetId_fkey`
  FOREIGN KEY (`fileAssetId`) REFERENCES `media_assets` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
