#!/usr/bin/env python
import os
import json
import psycopg2
from datetime import datetime
from urllib.parse import urlparse

def backup_postgres():
    """Backup PostgreSQL database to JSON file"""
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")

    # Parse the connection URL
    url = urlparse(database_url)
    
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        dbname=url.path[1:],
        user=url.username,
        password=url.password,
        host=url.hostname,
        port=url.port
    )
    cursor = conn.cursor()

    # Get all tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = cursor.fetchall()

    # Initialize backup data
    backup_data = {}

    # Export each table
    for table in tables:
        table_name = table[0]
        cursor.execute(f'SELECT * FROM "{table_name}"')
        rows = cursor.fetchall()
        
        # Get column names
        cursor.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}'
            AND table_schema = 'public'
        """)
        columns = [col[0] for col in cursor.fetchall()]
        
        # Store table data
        backup_data[table_name] = {
            'columns': columns,
            'rows': rows
        }

    conn.close()

    # Create backups directory if it doesn't exist
    os.makedirs('backups', exist_ok=True)

    # Save to JSON file with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'backups/db_backup_{timestamp}.json'
    
    with open(backup_file, 'w') as f:
        json.dump(backup_data, f, default=str)
    
    print(f"Backup completed: {backup_file}")
    
    # Keep only last 5 backups
    backup_files = sorted(os.listdir('backups'))
    if len(backup_files) > 5:
        for old_file in backup_files[:-5]:
            os.remove(os.path.join('backups', old_file))
            print(f"Removed old backup: {old_file}")

if __name__ == "__main__":
    backup_postgres() 