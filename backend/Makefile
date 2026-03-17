.PHONY: dev seed migrate upgrade downgrade shell

# ── Development ─────────────────────────────────────────────────────────────
dev:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ── Database ─────────────────────────────────────────────────────────────────
seed:
	cd backend && uv run python -m app.seed

migrate:
	cd backend && alembic revision --autogenerate -m "$(msg)"

upgrade:
	cd backend && alembic upgrade head

downgrade:
	cd backend && alembic downgrade -1

# ── Utilities ────────────────────────────────────────────────────────────────
shell:
	cd backend && uv run python -c "from app.database import SessionLocal; db = SessionLocal(); print('DB shell ready as db')"
