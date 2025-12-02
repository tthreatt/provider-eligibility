import json
import os
import sqlite3
from urllib.parse import urlparse

import psycopg2


def export_sqlite_data():
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()

    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    data = {}
    for table in tables:
        table_name = table[0]
        cursor.execute(f"SELECT * FROM {table_name}")
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        data[table_name] = {"columns": columns, "rows": rows}

    conn.close()
    return data


def import_to_postgres(pg_url, data):
    # Parse the connection URL
    url = urlparse(pg_url)
    conn = psycopg2.connect(
        dbname=url.path[1:],
        user=url.username,
        password=url.password,
        host=url.hostname,
        port=url.port,
    )
    cursor = conn.cursor()

    for table_name, table_data in data.items():
        # Create table
        columns = table_data["columns"]
        column_defs = [
            f"{col} TEXT" for col in columns
        ]  # You might need to adjust types
        create_query = (
            f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(column_defs)})"
        )
        cursor.execute(create_query)

        # Insert data
        for row in table_data["rows"]:
            placeholders = ",".join(["%s"] * len(row))
            insert_query = f"INSERT INTO {table_name} ({','.join(columns)}) VALUES ({placeholders})"
            cursor.execute(insert_query, row)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    # Export from SQLite
    print("Exporting data from SQLite...")
    data = export_sqlite_data()

    # Save to JSON as backup
    with open("database_backup.json", "w") as f:
        json.dump(data, f)
    print("Backup saved to database_backup.json")

    # Get PostgreSQL URL from environment
    pg_url = os.getenv("DATABASE_URL")
    if not pg_url:
        print("Error: DATABASE_URL environment variable not set")
        exit(1)

    print("Importing data to Postgres...")
    import_to_postgres(pg_url, data)
    print("Migration completed!")
