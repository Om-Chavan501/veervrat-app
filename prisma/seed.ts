import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { prisma } from "../lib/prisma";
import { LacunaCategory } from "@prisma/client";

function readCSV(fileName: string): Promise<any[]> {
  const filePath = path.join(process.cwd(), "prisma/data", fileName);
  return new Promise((resolve, reject) => {
    const rows: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function seedVirtues() {
  const rows = await readCSV("virtues.csv");

  for (const r of rows) {
    await prisma.virtue.upsert({
      where: { nameEn: r.name_en },
      update: { nameMr: r.name_mr },
      create: {
        nameEn: r.name_en,
        nameMr: r.name_mr,
      },
    });
  }
}

async function seedSubVirtues() {
  const rows = await readCSV("subvirtues.csv");

  for (const r of rows) {
    const virtue = await prisma.virtue.findUnique({
      where: { nameEn: r.virtue_name_en },
    });

    if (!virtue) {
      throw new Error(`Virtue not found: ${r.virtue_name_en}`);
    }

    await prisma.subVirtue.upsert({
      where: { nameEn: r.name_en },
      update: {
        nameMr: r.name_mr,
        virtueId: virtue.id,
      },
      create: {
        nameEn: r.name_en,
        nameMr: r.name_mr,
        virtueId: virtue.id,
      },
    });
  }
}

async function seedSentences() {
  const rows = await readCSV("sentences.csv");

  for (const r of rows) {
    const subVirtue = await prisma.subVirtue.findUnique({
      where: { nameEn: r.subvirtue_name_en },
    });

    if (!subVirtue) {
      throw new Error(`SubVirtue not found: ${r.subvirtue_name_en}`);
    }

    await prisma.sentence.upsert({
      where: { textEn: r.text_en },
      update: {
        textMr: r.text_mr,
        subVirtueId: subVirtue.id,
      },
      create: {
        textEn: r.text_en,
        textMr: r.text_mr,
        subVirtueId: subVirtue.id,
      },
    });
  }
}

async function seedLacunae() {
  const rows = await readCSV("lacunae.csv");

  for (const r of rows) {
    const category = r.category as LacunaCategory;

    if (!["A", "B", "C"].includes(category)) {
      throw new Error(
        `Invalid category for lacuna ${r.name_en}: ${r.category}`
      );
    }

    await prisma.lacuna.upsert({
      where: { nameEn: r.name_en },
      update: {
        nameMr: r.name_mr,
        category,
      },
      create: {
        nameEn: r.name_en,
        nameMr: r.name_mr,
        category,
      },
    });
  }
}


async function seedLacunaSubVirtues() {
  const rows = await readCSV("lacuna_subvirtues.csv");

  for (const r of rows) 
    {

    console.log(
      "Mapping row:",
      r.lacuna_name_en,
      "→",
      JSON.stringify(r.subvirtue_name_en)
    );

    const lacuna = await prisma.lacuna.findUnique({
      where: { nameEn: r.lacuna_name_en },
    });
    const subVirtue = await prisma.subVirtue.findUnique({
      where: { nameEn: r.subvirtue_name_en },
    });

    if (!lacuna || !subVirtue) {
      throw new Error(
        `Mapping failed: ${r.lacuna_name_en} → ${r.subvirtue_name_en}`
      );
    }

    await prisma.lacunaSubVirtue.upsert({
      where: {
        lacunaId_subVirtueId: {
          lacunaId: lacuna.id,
          subVirtueId: subVirtue.id,
        },
      },
      update: { priority: Number(r.priority) },
      create: {
        lacunaId: lacuna.id,
        subVirtueId: subVirtue.id,
        priority: Number(r.priority),
      },
    });
  }
}

async function main() {
  console.log("🌱 Veervrat ontology seeding started");

  await seedVirtues();
  await seedSubVirtues();
  await seedSentences();
  await seedLacunae();
  await seedLacunaSubVirtues();

  console.log("✅ Veervrat ontology seeding completed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
