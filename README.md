# BRSR Assessment Tool

A comprehensive Business Responsibility and Sustainability Reporting (BRSR) assessment platform built with Next.js, PostgreSQL, and modern web technologies.

## Features

- **Complete ESG Assessment**: 77 questions across 8 sections covering workforce, safety, health, environmental performance, business conduct, ethics, and related party transactions
- **Intelligent Scoring**: Advanced algorithms with industry benchmarks and weighted section scoring
- **Professional Reports**: PDF generation with charts, analytics, and recommendations
- **User Authentication**: Secure JWT-based authentication with refresh tokens
- **Real-time Analytics**: Performance insights, trends, and benchmarking
- **Responsive Design**: Mobile-first design with professional UI/UX

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, PostgreSQL, JWT Authentication
- **UI Components**: Radix UI, shadcn/ui, Lucide Icons
- **Charts**: Recharts, Chart.js
- **Reports**: PDFKit, Canvas
- **Deployment**: Vercel, Docker

## Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- PostgreSQL 15+
- Git

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd brsr-assessment-tool
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   \`\`\`

4. **Set up the database**
   \`\`\`bash
   # Create PostgreSQL database
   createdb brsr_assessment
   
   # Run database migrations
   npm run db:migrate
   \`\`\`

5. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Production Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   \`\`\`bash
   npm i -g vercel
   vercel
   \`\`\`

2. **Set environment variables in Vercel dashboard**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `REFRESH_TOKEN_EXPIRES_IN`

3. **Deploy**
   \`\`\`bash
   vercel --prod
   \`\`\`

### Docker

1. **Build and run with Docker Compose**
   \`\`\`bash
   docker-compose up --build
   \`\`\`

2. **Or build Docker image manually**
   \`\`\`bash
   docker build -t brsr-assessment-tool .
   docker run -p 3000:3000 brsr-assessment-tool
   \`\`\`

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes | - |
| `JWT_EXPIRES_IN` | Access token expiration | No | 7d |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration | No | 30d |
| `NODE_ENV` | Environment mode | No | development |
| `NEXT_PUBLIC_APP_URL` | Application URL | No | http://localhost:3000 |

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get user profile
- `PUT /api/auth/me` - Update user profile

### Assessment Endpoints

- `GET /api/assessments` - List user assessments
- `POST /api/assessments` - Create new assessment
- `GET /api/assessments/:id` - Get assessment details
- `PUT /api/assessments/:id` - Update assessment
- `DELETE /api/assessments/:id` - Delete assessment
- `POST /api/assess` - Save assessment responses
- `GET /api/assessments/:id/data` - Get assessment data

### Report Endpoints

- `POST /api/report` - Generate report
- `GET /api/reports/:id/download` - Download report
- `GET /api/analytics/:id` - Get assessment analytics

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and profiles
- `assessments` - Assessment instances
- `assessment_responses` - Individual question responses
- `section_scores` - Calculated section scores
- `reports` - Generated report metadata

## Scoring Algorithm

The scoring system uses weighted calculations:

- **Environmental**: 25% (highest weight)
- **Workforce**: 20%
- **Safety**: 15%
- **Business Conduct**: 15%
- **Health**: 10%
- **Business**: 10%
- **Business Openness**: 3%
- **Related Party**: 2%

Each section score combines:
- **Completion Score** (40%): Questions answered / Total questions
- **Quality Score** (60%): Performance against industry benchmarks

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@brsr-tool.com or create an issue in the repository.
