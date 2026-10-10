-- 06.6.6 统一文件资源结构修复：幂等补齐 MediaAsset / SkillVersion / Prompt 字段。
-- 可在 Navicat 中执行；不会 DROP、不会 RESET、不会删除已有业务数据。
SET NAMES utf8mb4;
SET @db := DATABASE();

-- 说明：正式运行优先使用 npm run storage:repair，下面 SQL 作为数据库管理员的手工兜底。
-- MySQL 8.4 可逐条执行 information_schema 检测后执行缺失项。

SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='storageProvider')=0,'ALTER TABLE `media_assets` ADD COLUMN `storageProvider` VARCHAR(30) NOT NULL DEFAULT ''LOCAL''','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='storageKey')=0,'ALTER TABLE `media_assets` ADD COLUMN `storageKey` VARCHAR(2000) NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='originalName')=0,'ALTER TABLE `media_assets` ADD COLUMN `originalName` VARCHAR(500) NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='extension')=0,'ALTER TABLE `media_assets` ADD COLUMN `extension` VARCHAR(30) NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='folder')=0,'ALTER TABLE `media_assets` ADD COLUMN `folder` VARCHAR(255) NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='width')=0,'ALTER TABLE `media_assets` ADD COLUMN `width` INT NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='height')=0,'ALTER TABLE `media_assets` ADD COLUMN `height` INT NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='metadata')=0,'ALTER TABLE `media_assets` ADD COLUMN `metadata` JSON NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='media_assets' AND column_name='isPublic')=0,'ALTER TABLE `media_assets` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT TRUE','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='skill_versions' AND column_name='fileAssetId')=0,'ALTER TABLE `skill_versions` ADD COLUMN `fileAssetId` INT NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='skill_versions' AND column_name='fileName')=0,'ALTER TABLE `skill_versions` ADD COLUMN `fileName` VARCHAR(255) NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='skill_versions' AND column_name='mimeType')=0,'ALTER TABLE `skill_versions` ADD COLUMN `mimeType` VARCHAR(100) NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='prompts' AND column_name='fileAssetId')=0,'ALTER TABLE `prompts` ADD COLUMN `fileAssetId` INT NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='prompts' AND column_name='fileName')=0,'ALTER TABLE `prompts` ADD COLUMN `fileName` VARCHAR(255) NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='prompts' AND column_name='fileType')=0,'ALTER TABLE `prompts` ADD COLUMN `fileType` VARCHAR(100) NULL','SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
