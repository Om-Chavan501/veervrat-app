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
from app.models.models import Lacuna, Virtue, SubVirtue, LacunaSubVirtue, Sentence, LacunaCategory

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


if __name__ == "__main__":
    seed()
