-- Stage 06.6.5: 文件存储配置正式化与幂等修复。
-- 不删除任何现有业务数据；如果 storage_configs 已存在则保持原配置。
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `storage_configs` (
  `id` INT NOT NULL DEFAULT 1,
  `provider` VARCHAR(30) NOT NULL DEFAULT 'LOCAL',
  `endpoint` VARCHAR(500) NULL,
  `region` VARCHAR(100) NULL,
  `bucket` VARCHAR(255) NULL,
  `accessKeyId` VARCHAR(255) NULL,
  `secretEncrypted` VARCHAR(1000) NULL,
  `basePath` VARCHAR(500) NULL,
  `cdnUrl` VARCHAR(1000) NULL,
  `maxFileSizeMb` INT NOT NULL DEFAULT 2048,
  `allowedTypes` JSON NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件存储配置表：本地存储与阿里云 OSS 配置';

INSERT INTO `storage_configs` (`id`,`provider`,`maxFileSizeMb`,`allowedTypes`,`enabled`,`createdAt`,`updatedAt`)
VALUES (1,'LOCAL',2048,JSON_ARRAY('IMAGE','VIDEO','AUDIO','ARCHIVE','PDF','WORD','SPREADSHEET','PRESENTATION','MARKDOWN','TEXT','FILE'),TRUE,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `id`=`id`;
