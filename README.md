# Supabase + Django Web API Server

Startup instructions for the Django Web API server.

## Getting started

```sh
cd api

# Install dependencies (if not yet)
uv sync

# Apply migrations
uv run python manage.py migrate

# Start the server
uv run python manage.py runserver localhost:8000

# Health check
curl http://localhost:8000/health
```

## Supabase local environment (Docker)

```sh
cd supabase
npm install
npm run local:start
```

## Create new migrations (when models change)

```sh
cd api

uv run python manage.py makemigrations
```

## Apply migrations to Supabase database

Supabase local default Postgres (after `npm run local:start`) listens on 54322.
Export the URL and run migrate:

```sh
cd api

export DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
uv run python manage.py migrate
```

## Remove migration files (cleanup)

Delete generated migration files (except `__init__.py`) per app, then recreate:

```sh
# Example: profiles app
cd api/profiles/migrations

rm 0*.py
rm 1*.py

# Recreate migrations
cd ../..
uv run python manage.py makemigrations
```
