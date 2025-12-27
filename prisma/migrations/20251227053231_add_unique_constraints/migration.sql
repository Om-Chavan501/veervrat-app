/*
  Warnings:

  - A unique constraint covering the columns `[nameEn]` on the table `Lacuna` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nameMr]` on the table `Lacuna` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[textEn]` on the table `Sentence` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[textMr]` on the table `Sentence` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nameEn]` on the table `SubVirtue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nameMr]` on the table `SubVirtue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nameEn]` on the table `Virtue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nameMr]` on the table `Virtue` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Lacuna_nameEn_key" ON "Lacuna"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "Lacuna_nameMr_key" ON "Lacuna"("nameMr");

-- CreateIndex
CREATE UNIQUE INDEX "Sentence_textEn_key" ON "Sentence"("textEn");

-- CreateIndex
CREATE UNIQUE INDEX "Sentence_textMr_key" ON "Sentence"("textMr");

-- CreateIndex
CREATE UNIQUE INDEX "SubVirtue_nameEn_key" ON "SubVirtue"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "SubVirtue_nameMr_key" ON "SubVirtue"("nameMr");

-- CreateIndex
CREATE UNIQUE INDEX "Virtue_nameEn_key" ON "Virtue"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "Virtue_nameMr_key" ON "Virtue"("nameMr");
