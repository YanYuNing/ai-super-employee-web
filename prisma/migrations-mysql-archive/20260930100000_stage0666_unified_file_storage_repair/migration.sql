-- Stage 06.6.6: 统一修复文件资源链路。
-- 解决历史数据库可能没有完整执行 06.6.4 / 06.6.5 文件资源迁移的问题。
-- 仅增量补齐，不删除数据。
SET NAMES utf8mb4;

SET @db := DATABASE();

-- media_assets 文件存储字段
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='storageProvider')=0,
  'ALTER TABLE `media_assets` ADD COLUMN `storageProvider` VARCHAR(30) NOT NULL DEFAULT ''LOCAL''', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='storageKey')=0,
  'ALTER TABLE `media_assets` ADD COLUMN `storageKey` VARCHAR(2000) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='originalName')=0,
  'ALTER TABLE `media_assets` ADD COLUMN `originalName` VARCHAR(500) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='extension')=0,
  'ALTER TABLE `media_assets` ADD COLUMN `extension` VARCHAR(30) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='folder')=0,
  'ALTER TABLE `media_assets` ADD COLUMN `folder` VARCHAR(255) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='width')=0,
  'ALTER TABLE `media_assets` ADD COLUMN `width` INT NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='height')=0,
  'ALTER TABLE `media_assets` ADD COLUMN `height` INT NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='metadata')=0,
  'ALTER TABLE `media_assets` ADD COLUMN `metadata` JSON NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='isPublic')=0,
  'ALTER TABLE `media_assets` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT TRUE', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- skill_versions 文件关联字段
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='skill_versions' AND column_name='fileAssetId')=0,
  'ALTER TABLE `skill_versions` ADD COLUMN `fileAssetId` INT NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='skill_versions' AND column_name='fileName')=0,
  'ALTER TABLE `skill_versions` ADD COLUMN `fileName` VARCHAR(255) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='skill_versions' AND column_name='mimeType')=0,
  'ALTER TABLE `skill_versions` ADD COLUMN `mimeType` VARCHAR(100) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- prompts 文件关联字段
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='prompts' AND column_name='fileAssetId')=0,
  'ALTER TABLE `prompts` ADD COLUMN `fileAssetId` INT NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='prompts' AND column_name='fileName')=0,
  'ALTER TABLE `prompts` ADD COLUMN `fileName` VARCHAR(255) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='prompts' AND column_name='fileType')=0,
  'ALTER TABLE `prompts` ADD COLUMN `fileType` VARCHAR(100) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 索引
SET @sql := IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='media_assets' AND index_name='media_assets_storageProvider_idx')=0,
  'CREATE INDEX `media_assets_storageProvider_idx` ON `media_assets` (`storageProvider`)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='media_assets' AND index_name='media_assets_folder_idx')=0,
  'CREATE INDEX `media_assets_folder_idx` ON `media_assets` (`folder`)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='skill_versions' AND index_name='skill_versions_fileAssetId_idx')=0,
  'CREATE INDEX `skill_versions_fileAssetId_idx` ON `skill_versions` (`fileAssetId`)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='prompts' AND index_name='prompts_fileAssetId_idx')=0,
  'CREATE INDEX `prompts_fileAssetId_idx` ON `prompts` (`fileAssetId`)', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 外键
SET @sql := IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='skill_versions' AND constraint_name='skill_versions_fileAssetId_fkey')=0,
  'ALTER TABLE `skill_versions` ADD CONSTRAINT `skill_versions_fileAssetId_fkey` FOREIGN KEY (`fileAssetId`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='prompts' AND constraint_name='prompts_fileAssetId_fkey')=0,
  'ALTER TABLE `prompts` ADD CONSTRAINT `prompts_fileAssetId_fkey` FOREIGN KEY (`fileAssetId`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
