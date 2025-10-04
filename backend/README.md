# Expense Management Backend

Backend API for the Expense Management System built with Express.js, Better Auth, and Prisma.

## Features

- 🔐 **Better Auth Integration** - Modern authentication with session management
- 👥 **User Management** - Role-based access control (Admin, Manager, Employee)
- 💼 **Company Management** - Multi-tenant support with company isolation
- 📊 **Expense Tracking** - Complete expense submission and tracking
- ✅ **Approval Workflows** - Flexible multi-level approval system
- 🌍 **Multi-currency Support** - Handle expenses in different currencies

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Authentication**: Better Auth
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the following variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/expense_management"
BETTER_AUTH_SECRET="your-super-secret-key-change-in-production"
BETTER_AUTH_URL="http://localhost:3001"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### 3. Setup Database

Generate Prisma client:

```bash
npm run db:generate
```

Push schema to database:

```bash
npm run db:push
```

Or run migrations:

```bash
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication (Better Auth)

All auth endpoints are prefixed with `/api/auth/`:

- `POST /api/auth/sign-up/email` - Register new user
- `POST /api/auth/sign-in/email` - Sign in
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/ok` - Health check

### Users

- `GET /api/users/me` - Get current user
- `GET /api/users` - Get all users (Admin/Manager)
- `POST /api/users` - Create new user (Admin)
- `PUT /api/users/:userId` - Update user (Admin)
- `DELETE /api/users/:userId` - Delete user (Admin)

### Health

- `GET /api/health` - Server health check
- `GET /api/session` - Get current session info

## Database Schema

### Key Models

- **User** - Users with role-based permissions
- **Company** - Multi-tenant company support
- **Expense** - Expense claims with status tracking
- **ApprovalRule** - Configurable approval rules
- **ApprovalStep** - Individual approval steps
- **Session** - Better Auth session management
- **Account** - Better Auth account management

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── controllers/           # Request handlers
│   │   └── userController.ts
│   ├── lib/
│   │   ├── auth.ts           # Better Auth configuration
│   │   └── db.ts             # Prisma client
│   ├── middleware/
│   │   ├── authMiddleware.ts # Auth & role middleware
│   │   └── errorHandler.ts   # Error handling
│   ├── routes/
│   │   └── userRoutes.ts     # API routes
│   └── server.ts             # Express app setup
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma client

### Testing Better Auth

Test the authentication flow:

```bash
# Health check
curl http://localhost:3001/api/auth/ok

# Sign up
curl -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Sign in
curl -X POST http://localhost:3001/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Important Notes

### Better Auth Integration

⚠️ **Critical**: The Better Auth handler (`app.all("/api/auth/*", ...)`) must be mounted **BEFORE** `express.json()` middleware. Otherwise, the client API will get stuck on "pending".

✅ **Correct Order**:
```typescript
app.all("/api/auth/*", toNodeHandler(auth));  // First
app.use(express.json());                      // After
```

### CORS Configuration

CORS is configured to allow requests from the frontend. Update `FRONTEND_URL` in `.env` to match your frontend domain.

### Session Management

Better Auth handles session management with secure HTTP-only cookies. Sessions expire after 7 days by default.

## Next Steps

- [ ] Add expense management endpoints
- [ ] Implement approval workflow logic
- [ ] Add email notifications
- [ ] Implement currency conversion service
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add unit and integration tests
- [ ] Set up logging and monitoring

## License

ISC
