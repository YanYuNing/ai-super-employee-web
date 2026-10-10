/*
  Warnings:

  - A unique constraint covering the columns `[pageId,sectionKey]` on the table `page_sections` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `page_sections_pageId_sectionKey_key` ON `page_sections`(`pageId`, `sectionKey`);
