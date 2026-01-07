# Provider Eligibility

A modern web application for managing healthcare provider eligibility verification, built with Next.js and FastAPI. The Eligibility Engine evaluates provider status based on federal and state monitoring and credential statuses.

## 🚀 Features

- **Full-stack application** with separate frontend and backend services
- **NPI Lookup** - Search and verify healthcare providers by National Provider Identifier
- **Eligibility Rules Management** - Configure and manage eligibility criteria
- **Real-time Verification** - Automated status determination through predefined rules
- Modern, responsive UI built with Next.js 15
- RESTful API powered by FastAPI
- Database management with SQLAlchemy and Alembic
- Modern UI components using Radix UI and Material-UI
- Type-safe development with TypeScript
- Styling with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Material-UI
- Radix UI Components (shadcn/ui)
- Lucide React Icons
- React Hook Form
- Zod for validation
- Recharts for data visualization
- Sonner for toast notifications
- Clerk for authentication

### Backend
- FastAPI
- SQLAlchemy
- Alembic for database migrations
- Python 3.9+
- PostgreSQL (Neon)
- Pydantic for data validation
- JWT authentication
- pytest for testing
- Ruff for linting and formatting

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- Python 3.x
- pip
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
```
- Edit `.env` and configure:
  - `DATABASE_URL`: Your PostgreSQL connection string
  - `API_KEY`: API key for authenticating requests (should match frontend)
  - `BASE_URL`: Base URL for the API (optional, defaults to http://localhost:8000)
  - `ENDPOINT_URL`: Endpoint URL for external API calls (optional)

5. Run database migrations:
```bash
alembic upgrade head
```

> **Note:** This project uses [Neon PostgreSQL](https://neon.tech/) as the database provider. The `DATABASE_URL` should be a PostgreSQL connection string.

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

**If you encounter Clerk/Next.js compatibility errors:**
```bash
# Clean install to fix version mismatches
rm -rf node_modules package-lock.json .next
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
- Edit `.env.local` and configure:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Get from [Clerk Dashboard](https://dashboard.clerk.com) (starts with `pk_test_...`)
  - `CLERK_SECRET_KEY`: Get from Clerk Dashboard (starts with `sk_test_...`)
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: Your Clerk sign-in URL (format: `https://your-app-name.clerk.accounts.dev/sign-in`)
  - `BACKEND_URL`: URL of your FastAPI backend (usually `http://localhost:8000` for local dev)
  - `API_KEY`: API key for backend authentication (should match backend `API_KEY`)
  
**Important**: Without these environment variables, the application will fail to start with Clerk-related errors.

## 🚀 Running the Application

### Backend
```bash
cd backend
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`

API documentation (Swagger UI) is available at `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm run dev
# or
yarn dev
```
The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
provider-eligibility/
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components (including shadcn/ui)
│   │   ├── services/      # API service functions
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   ├── hooks/             # Custom React hooks
│   ├── public/            # Static assets
│   └── styles/            # Global styles
├── backend/               # FastAPI backend application
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core configuration
│   │   ├── db/           # Database utilities
│   │   ├── models/       # SQLAlchemy models
│   │   ├── routes/       # Route handlers
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic services
│   ├── alembic/          # Database migrations
│   └── tests/            # Backend tests
├── scripts/              # Utility scripts
│   ├── db_backup.py      # Database backup utility
│   └── db_health_check.py # Database health monitoring
└── docs/                 # Project documentation
```

## 📚 Documentation

Additional documentation is available in the `/docs` directory:

| Document | Description |
|----------|-------------|
| [api-doc.md](docs/api-doc.md) | API endpoint documentation |
| [prd.md](docs/prd.md) | Product Requirements Document |
| [technical-doc.md](docs/technical-doc.md) | Technical specifications |
| [admin-ui.md](docs/admin-ui.md) | Admin UI documentation |
| [eligibility-ui.md](docs/eligibility-ui.md) | Eligibility UI documentation |
| [cred-req-doc.md](docs/cred-req-doc.md) | Credential requirements documentation |

### Clerk Authentication Guides
- [CLERK_AUTHENTICATION_STEPS.md](docs/CLERK_AUTHENTICATION_STEPS.md) - Setup instructions
- [CLERK_TROUBLESHOOTING.md](docs/CLERK_TROUBLESHOOTING.md) - Common issues and solutions
- [CLERK_DEV_BROWSER_FIX.md](docs/CLERK_DEV_BROWSER_FIX.md) - Development browser fixes

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

Run tests with coverage:
```bash
pytest --cov=app --cov-report=html
```

### Frontend Tests
```bash
cd frontend
npm test
# or
yarn test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🔧 Utility Scripts

The project includes utility scripts for database management:

### Database Backup
```bash
cd scripts
python db_backup.py
```
Creates a JSON backup of the PostgreSQL database. Automatically maintains the last 5 backups in the `backups/` directory.

### Database Health Check
```bash
cd scripts
python db_health_check.py
```
Checks database connectivity, displays PostgreSQL version, database size, table statistics, and active connections.

> **Note:** Both scripts require the `DATABASE_URL` environment variable to be set.

## 🔍 Code Quality

### Linting

#### Frontend
```bash
cd frontend
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
```

#### Backend
```bash
cd backend
ruff check .         # Check for linting errors
ruff check --fix .   # Auto-fix linting errors
```

### Formatting

#### Frontend
```bash
cd frontend
npm run format        # Format all files
npm run format:check  # Check formatting without making changes
```

#### Backend
```bash
cd backend
ruff format .        # Format all files
ruff format --check . # Check formatting without making changes
```

### Type Checking

#### Frontend
```bash
cd frontend
npm run type-check   # Run TypeScript type checking
```

## 🔄 Continuous Integration

This project uses GitHub Actions for CI/CD. The CI pipeline runs on every push and pull request and checks:

- **Frontend**: ESLint, Prettier formatting, TypeScript type checking, and Jest tests
- **Backend**: Ruff linting, Ruff formatting, and pytest tests

All checks must pass before code can be merged. You can view the CI status in the GitHub Actions tab.

## 🚀 Deployment

The application is configured for deployment on Vercel, with separate configurations for both frontend and backend services.

### Frontend Deployment
- Configure your Vercel project settings
- Connect your repository
- Deploy using the Vercel dashboard or CLI

### Backend Deployment
- Configure your Vercel project settings for the backend
- Set up the required environment variables
- Deploy using the Vercel dashboard or CLI

## 🤝 Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- ProviderTrust Engineering Team

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- FastAPI team for the excellent backend framework
- All contributors and maintainers 