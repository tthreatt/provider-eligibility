#!/usr/bin/env python
import os
import psycopg2
from urllib.parse import urlparse
from datetime import datetime

def check_database_health():
    """Check PostgreSQL database health and connection"""
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")

    # Parse the connection URL
    url = urlparse(database_url)
    
    try:
        # Try to connect
        conn = psycopg2.connect(
            dbname=url.path[1:],
            user=url.username,
            password=url.password,
            host=url.hostname,
            port=url.port
        )
        cursor = conn.cursor()

        # Check if we can execute queries
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"Database connection successful")
        print(f"PostgreSQL version: {version}")

        # Get database size
        cursor.execute("""
            SELECT pg_size_pretty(pg_database_size(current_database()))
        """)
        db_size = cursor.fetchone()[0]
        print(f"Database size: {db_size}")

        # Get table information
        cursor.execute("""
            SELECT 
                table_schema,
                table_name,
                (xpath('/row/cnt/text()', xml_count))[1]::text::int AS row_count
            FROM (
                SELECT 
                    table_schema,
                    table_name,
                    query_to_xml(format('select count(*) as cnt from %I.%I', table_schema, table_name), false, true, '') as xml_count
                FROM information_schema.tables
                WHERE table_schema = 'public'
            ) t
        """)
        table_stats = cursor.fetchall()
        print("\nTable Statistics:")
        for schema, table, count in table_stats:
            print(f"- {schema}.{table}: {count} rows")

        # Check connection pool
        cursor.execute("""
            SELECT count(*) 
            FROM pg_stat_activity 
            WHERE datname = current_database()
        """)
        connections = cursor.fetchone()[0]
        print(f"\nActive connections: {connections}")

        conn.close()
        return True

    except Exception as e:
        print(f"Database health check failed: {str(e)}")
        return False

if __name__ == "__main__":
    check_database_health() 