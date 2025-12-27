/*
  Warnings:

  - Added the required column `priority` to the `LacunaSubVirtue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LacunaSubVirtue" ADD COLUMN     "priority" INTEGER NOT NULL;
