"""
Seed script: reads CSV data from prisma/data/ and inserts into the new database.
Run from backend/ directory:
    python -m app.seed.seed
"""
import csv
import os
import sys
import uuid

# Ensure project root is discoverable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.models import (
    Lacuna, Virtue, SubVirtue, LacunaSubVirtue, Sentence, LacunaCategory,
    ExposureCatalogItem, ResolutionCatalogItem, ChallengeCatalogItem,
)

DATA_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "../../../prisma/data"
)


def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Lacuna).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # ── Virtues ──────────────────────────────────────────────────────
        virtue_map: dict[str, str] = {}  # nameEn -> id
        with open(os.path.join(DATA_DIR, "virtues.csv"), encoding="utf-8") as f:
            for row in csv.DictReader(f):
                v_id = str(uuid.uuid4())
                virtue = Virtue(id=v_id, name_en=row["name_en"], name_mr=row["name_mr"])
                db.add(virtue)
                virtue_map[row["name_en"]] = v_id
        db.flush()
        print(f"  Seeded {len(virtue_map)} virtues")

        # ── SubVirtues ────────────────────────────────────────────────────
        sv_map: dict[str, str] = {}  # nameEn -> id
        with open(os.path.join(DATA_DIR, "subvirtues.csv"), encoding="utf-8") as f:
            for row in csv.DictReader(f):
                virtue_id = virtue_map.get(row["virtue_name_en"])
                if not virtue_id:
                    print(f"  WARNING: virtue '{row['virtue_name_en']}' not found for subvirtue '{row['name_en']}'")
                    continue
                sv_id = str(uuid.uuid4())
                sv = SubVirtue(id=sv_id, name_en=row["name_en"], name_mr=row["name_mr"], virtue_id=virtue_id)
                db.add(sv)
                sv_map[row["name_en"]] = sv_id
        db.flush()
        print(f"  Seeded {len(sv_map)} sub-virtues")

        # ── Lacunae ───────────────────────────────────────────────────────
        lacuna_map: dict[str, str] = {}  # nameEn -> id
        with open(os.path.join(DATA_DIR, "lacunae.csv"), encoding="utf-8") as f:
            for row in csv.DictReader(f):
                l_id = str(uuid.uuid4())
                cat = LacunaCategory(row["category"].strip().upper())
                lacuna = Lacuna(id=l_id, name_en=row["name_en"], name_mr=row["name_mr"], category=cat)
                db.add(lacuna)
                lacuna_map[row["name_en"]] = l_id
        db.flush()
        print(f"  Seeded {len(lacuna_map)} lacunae")

        # ── LacunaSubVirtues ──────────────────────────────────────────────
        lsv_count = 0
        with open(os.path.join(DATA_DIR, "lacuna_subvirtues.csv"), encoding="utf-8") as f:
            for row in csv.DictReader(f):
                lacuna_id = lacuna_map.get(row["lacuna_name_en"])
                sv_id = sv_map.get(row["subvirtue_name_en"])
                if not lacuna_id or not sv_id:
                    continue
                lsv = LacunaSubVirtue(
                    id=str(uuid.uuid4()),
                    lacuna_id=lacuna_id,
                    sub_virtue_id=sv_id,
                    priority=int(row["priority"]),
                )
                db.add(lsv)
                lsv_count += 1
        db.flush()
        print(f"  Seeded {lsv_count} lacuna-subvirtue mappings")

        # ── Sentences ─────────────────────────────────────────────────────
        sentence_count = 0
        with open(os.path.join(DATA_DIR, "sentences.csv"), encoding="utf-8") as f:
            for row in csv.DictReader(f):
                sv_id = sv_map.get(row["subvirtue_name_en"])
                if not sv_id:
                    continue
                s = Sentence(
                    id=str(uuid.uuid4()),
                    text_en=row["text_en"],
                    text_mr=row["text_mr"],
                    sub_virtue_id=sv_id,
                )
                db.add(s)
                sentence_count += 1
        db.flush()
        print(f"  Seeded {sentence_count} sentences")

        db.commit()
        print("✓ Seeding complete!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


def seed_catalog():
    """
    Seed catalog items for each sentence.
    Safe to run multiple times — skips if already populated.
    """
    db = SessionLocal()
    try:
        if db.query(ExposureCatalogItem).count() > 0:
            print("Catalog already seeded. Skipping.")
            return

        sentences = db.query(Sentence).all()
        if not sentences:
            print("No sentences found — run seed() first.")
            return

        print(f"Seeding catalog for {len(sentences)} sentences...")

        exposure_templates = [
            ("Read about it", "Find and read an article, book chapter, or resource related to this virtue."),
            ("Observe in real life", "Notice examples of this virtue (or its absence) in people around you today."),
            ("Discuss with someone", "Talk to a trusted person about what this virtue means and where you see it practiced."),
        ]
        resolution_templates = [
            ("Morning intention", "Start each day by setting a clear intention to practice this virtue.", "Daily"),
            ("Evening reflection", "Before bed, review one moment from the day where this virtue showed up or was missing.", "Daily"),
            ("Weekly journal entry", "Write a short journal entry about your progress with this virtue each week.", "Weekly"),
        ]
        challenge_templates = [
            (
                "Demonstrate it in a real situation",
                "Identify one upcoming real-life situation where you can consciously apply this virtue.",
                "Act on this virtue in a real situation at least once, then reflect on what happened.",
            ),
            (
                "Teach or share it",
                "Explain this virtue and why it matters to someone in your life.",
                "Have a genuine conversation where you share what you've learned about this virtue.",
            ),
        ]

        for sentence in sentences:
            for title, description in exposure_templates:
                db.add(ExposureCatalogItem(
                    id=str(uuid.uuid4()),
                    sentence_id=sentence.id,
                    title=title,
                    description=description,
                ))
            for title, description, freq_hint in resolution_templates:
                db.add(ResolutionCatalogItem(
                    id=str(uuid.uuid4()),
                    sentence_id=sentence.id,
                    title=title,
                    description=description,
                    frequency_hint=freq_hint,
                ))
            for title, description, criteria in challenge_templates:
                db.add(ChallengeCatalogItem(
                    id=str(uuid.uuid4()),
                    sentence_id=sentence.id,
                    title=title,
                    description=description,
                    achievement_criteria=criteria,
                ))

        db.commit()
        total = len(sentences) * (len(exposure_templates) + len(resolution_templates) + len(challenge_templates))
        print(f"✓ Catalog seeding complete! ({total} items)")

    except Exception as e:
        db.rollback()
        print(f"Error during catalog seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    seed_catalog()
