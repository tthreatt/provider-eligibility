# Provider Eligibility

A modern web application for managing provider eligibility verification, built with Next.js and FastAPI.

## 🚀 Features

- Full-stack application with separate frontend and backend services
- Modern, responsive UI built with Next.js 14
- RESTful API powered by FastAPI
- Authentication and authorization using Clerk
- Database management with SQLAlchemy and Alembic
- Modern UI components using Radix UI and Material-UI
- Type-safe development with TypeScript
- Styling with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Material-UI
- Radix UI Components
- React Hook Form
- Zod for validation
- Clerk for authentication

### Backend
- FastAPI
- SQLAlchemy
- Alembic for database migrations
- Python 3.x
- PostgreSQL/SQLite
- Pydantic for data validation
- JWT authentication
- pytest for testing

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
- Copy `.env.example` to `.env` (if available)
- Configure your database and other environment variables

5. Run database migrations:
```bash
alembic upgrade head
```

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

3. Set up environment variables:
- Copy `.env.local.example` to `.env.local` (if available)
- Configure your environment variables

## 🚀 Running the Application

### Backend
```bash
cd backend
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`

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
├── frontend/
│   ├── src/
│   ├── public/
│   ├── styles/
│   └── package.json
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
└── docs/
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
# or
yarn test
```

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

- Your Name/Team

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- FastAPI team for the excellent backend framework
- All contributors and maintainers 