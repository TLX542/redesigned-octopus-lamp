# Backend

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
docker compose up -d
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --reload-dir app --reload-exclude ".venv/*"

```

The backend now expects PostgreSQL. Default local connection in `.env.example`:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/cs308_store
```

Start only the database service from the `backend` directory with:

```bash
docker compose up -d
```

Stop it with:

```bash
docker compose down
```

Apply database migrations from the `backend` directory with:

```bash
alembic upgrade head
```

Because the local virtual environment lives inside `backend/.venv`, use `--reload-dir app` during development so Uvicorn watches only application code and does not loop on `site-packages` changes.

Seeded local accounts after startup:

- Admin: `admin@example.com` / `admin12345`
- Customer: `customer@example.com` / `password123`

## Auth Testing

- `POST /api/auth/register`: create a new user with a hashed password
- `POST /api/auth/login`: receive a bearer token
- `GET /api/users/me`: send `Authorization: Bearer <token>` to test a protected route

Demo login after startup:

```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

## Structure

- `app/api`: FastAPI route modules
- `app/core`: settings and shared config
- `app/db`: SQLAlchemy models, session setup, and seed data
- `app/schemas`: Pydantic schemas
