-- 06.6.8: 9大AI员工标识 + 资源文件关联
SET @db = DATABASE();
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `products` ADD COLUMN `isEmployee` BOOLEAN NOT NULL DEFAULT FALSE', 'SELECT 1') FROM information_schema.columns WHERE table_schema=@db AND table_name='products' AND column_name='isEmployee');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `resources` ADD COLUMN `fileAssetId` INT NULL', 'SELECT 1') FROM information_schema.columns WHERE table_schema=@db AND table_name='resources' AND column_name='fileAssetId');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `products_isEmployee_idx` ON `products` (`isEmployee`,`status`,`sortOrder`)', 'SELECT 1') FROM information_schema.statistics WHERE table_schema=@db AND table_name='products' AND index_name='products_isEmployee_idx');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `resources_fileAssetId_idx` ON `resources` (`fileAssetId`)', 'SELECT 1') FROM information_schema.statistics WHERE table_schema=@db AND table_name='resources' AND index_name='resources_fileAssetId_idx');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `resources` ADD CONSTRAINT `resources_fileAssetId_fkey` FOREIGN KEY (`fileAssetId`) REFERENCES `media_assets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE', 'SELECT 1') FROM information_schema.table_constraints WHERE constraint_schema=@db AND table_name='resources' AND constraint_name='resources_fileAssetId_fkey');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE products SET isEmployee = FALSE;
UPDATE products SET isEmployee = TRUE WHERE slug IN ('ai-video','ai-mix','ai-image','ip-agent','geo','ai-lead','douyin-customer-service','wechat-customer-service','wecom-customer-service');
