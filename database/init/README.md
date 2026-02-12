# Database Initialization Scripts

This directory contains SQL scripts that PostgreSQL executes automatically when the container starts for the first time.

## How it works

PostgreSQL Docker image runs any `.sql`, `.sql.gz`, or `.sh` files found in `/docker-entrypoint-initdb.d/` on first initialization.

## Files

- `01-seed-users.sql` - Inserts the default users (Leo and Anto) into the database

## Note

These scripts only run when the database is created for the first time (when the volume is empty). If you need to run them again, you'll need to delete the postgres volume:

```bash
docker compose down -v
docker compose up -d
```

⚠️ **Warning**: This will delete all data in the database!
