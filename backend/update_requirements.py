import subprocess

requirements = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "python-dotenv>=1.0.0",
    "sqlalchemy>=2.0.25",
    "pydantic>=2.5.3",
    "pydantic-settings>=2.1.0",
    "python-jose>=3.3.0",
    "requests>=2.31.0",
    "psycopg2-binary>=2.9.9",  # PostgreSQL adapter
    "alembic>=1.13.1",  # Database migrations
    "python-multipart>=0.0.6",  # For form data
    "bcrypt>=4.1.2",  # For password hashing
    "httpx>=0.26.0",  # For async HTTP requests
    "pytest>=7.4.4",  # For testing
    "pytest-asyncio>=0.23.3",  # For async tests
]

# Write requirements to file
with open("requirements.txt", "w") as f:
    for req in requirements:
        f.write(req + "\n")

# Install/upgrade all packages
subprocess.run(["pip", "install", "--upgrade", "-r", "requirements.txt"])

print("✅ Dependencies updated successfully!")
