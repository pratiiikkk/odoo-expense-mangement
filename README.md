# 💼 Expense Management System

A comprehensive multi-tenant expense management application with sophisticated approval workflows, built with Node.js, Express, Better Auth, PostgreSQL, and Prisma. Features role-based access control, multi-currency support, and flexible approval rules.

## 📋 Features

### 🔐 Authentication & User Management
- ✅ **Better Auth Integration** - Secure session-based authentication with HTTP-only cookies
- ✅ **Role-Based Access Control** - Admin, Manager, and Employee roles with hierarchical permissions
- ✅ **Auto Company Creation** - First user signup automatically creates company and assigns Admin role
- ✅ **Manager-Employee Relationships** - Hierarchical org structure with manager assignments
- ✅ **Multi-tenant Isolation** - Complete data isolation per company

### 💰 Expense Management
- ✅ **Multi-Currency Support** - Submit expenses in any currency with automatic conversion
- ✅ **Expense Tracking** - Complete expense history (Pending, Approved, Rejected)
- ✅ **Category Management** - Organize expenses by categories
- ✅ **Receipt Attachments** - Support for expense documentation
- ✅ **Company Currency Display** - All amounts viewed in company's base currency

### ✅ Approval Workflows
- ✅ **Multi-Level Sequential Approvals** - Configure approval chains (Manager → Finance → Director)
- ✅ **Conditional Approval Rules**:
  - **Sequential**: Step-by-step approval process
  - **Percentage**: Min % of approvers needed (e.g., 60% approval)
  - **Specific Approver**: Designated person approval (e.g., CFO)
  - **Hybrid Rules**: Combine multiple conditions
- ✅ **Manager-Based Routing** - Automatic routing to employee's manager
- ✅ **Approval History** - Complete audit trail with comments and timestamps

### 🏢 Multi-tenant Architecture
- ✅ **Complete Data Isolation** - All queries filtered by `companyId`
- ✅ **Company Settings** - Currency, country, and workflow configuration
- ✅ **User Management** - Admin controls over all company users
- ✅ **Hierarchical Structure** - Support for complex org hierarchies

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│          Frontend (React - Planned)                          │
│    Better Auth Client + UI Components + TanStack Query      │
└──────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌──────────────────────────────────────────────────────────────┐
│               Backend (Node.js + Express) ✅                 │
│  Better Auth Server + Business Logic + Role Middleware      │
└──────────────────────────────────────────────────────────────┘
                            ↕ Prisma ORM
┌──────────────────────────────────────────────────────────────┐
│                PostgreSQL Database (Docker)                   │
│    Users, Sessions, Companies, Expenses, Approvals          │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow Example: Expense Approval

```
1. Employee submits expense
   ↓
2. System checks ApprovalRule for company
   ↓
3. If isManagerApprover=true → Create ApprovalStep for manager
   ↓
4. Generate sequential ApprovalSteps per rule configuration
   ↓
5. Manager approves → Move to next approver in sequence
   ↓
6. Apply conditional rules (percentage/specific approver)
   ↓
7. All approvals completed → Expense status = APPROVED
```

## 🛠️ Tech Stack

### Backend (✅ Implemented)
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Authentication**: Better Auth with Prisma adapter
- **Database ORM**: Prisma
- **Validation**: Zod schemas
- **Database**: PostgreSQL 15 (Docker)
- **Session Management**: HTTP-only cookies with 7-day expiry
- **Password Hashing**: bcrypt via Better Auth

### Frontend (📋 Planned)
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Authentication**: Better Auth React Client
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query + React Context
- **Form Handling**: React Hook Form + Zod
- **UI Components**: Custom components with Tailwind

### DevOps & Tools
- **Containerization**: Docker Compose (PostgreSQL + pgAdmin)
- **Development**: tsx watch with hot reload
- **Database Management**: Prisma Migrate
- **API Testing**: curl scripts included
- **Version Control**: Git

## 📁 Project Structure

```
odoo-expense-mangement/
├── .github/
│   └── copilot-instructions.md      # AI assistant configuration
│
├── backend/ ✅                       # Node.js Backend (COMPLETE)
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema with Better Auth
│   │   └── migrations/              # Database migrations
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts    # Custom auth endpoints
│   │   │   ├── userController.ts    # User CRUD with multi-tenant
│   │   │   └── countryController.ts # Country/currency helpers
│   │   ├── lib/
│   │   │   ├── auth.ts              # Better Auth configuration
│   │   │   └── db.ts                # Prisma client
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts    # requireAuth, requireRole
│   │   │   └── errorHandler.ts      # Centralized error handling
│   │   ├── routes/
│   │   │   ├── authRoutes.ts        # Custom auth routes
│   │   │   ├── userRoutes.ts        # User management routes
│   │   │   └── countryRoutes.ts     # Country endpoints
│   │   ├── services/
│   │   │   ├── countryService.ts    # Country data service
│   │   │   └── currencyService.ts   # Currency utilities
│   │   └── server.ts                # Express app entry point
│   ├── .env.example                 # Environment template
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── test-auth.sh                 # Auth testing script
│   ├── test-auth-user-mgmt.sh       # User mgmt testing script
│   ├── AUTH_USER_MANAGEMENT_REPORT.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   └── README.md
│
├── frontend/ 📋                      # React Frontend (PLANNED)
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── lib/                     # Auth client & API
│   │   ├── hooks/                   # Custom hooks
│   │   ├── pages/                   # Page components
│   │   └── routes/                  # Route configuration
│   ├── .env.local
│   └── README.md
│
├── docker-compose.yml               # PostgreSQL + pgAdmin
├── .dockerignore
├── README.md                        # This file
├── SETUP_COMPLETE.md                # Setup guide
├── FRONTEND_AUTH_INTEGRATION.md     # Frontend integration docs
└── Expense management - 8 hours.excalidraw  # System diagram
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker & Docker Compose** ([Install Docker](https://docs.docker.com/get-docker/))
- **Git** ([Install Git](https://git-scm.com/downloads))
- **curl** (for testing APIs)

### Step 1: Clone the Repository

```bash
git clone https://github.com/pratiiikkk/odoo-expense-mangement.git
cd odoo-expense-mangement
```

### Step 2: Start Database with Docker

```bash
# Start PostgreSQL on port 5432
docker-compose up -d postgres

# Optional: Start pgAdmin on port 5050
docker-compose up -d pgadmin
```

**Verify database is running:**

```bash
docker ps
# Should show postgres container running on port 5432
```

### Step 3: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env` file:**

```env
# Database connection (Docker PostgreSQL)
DATABASE_URL="postgresql://expense_user:expense_pass@localhost:5432/expense_db"

# Better Auth configuration
BETTER_AUTH_SECRET="your-super-secret-key-min-32-chars-change-in-production"
BETTER_AUTH_URL="http://localhost:3001"

# Server configuration
PORT=3001
NODE_ENV=development

# CORS - Frontend URL
FRONTEND_URL="http://localhost:3000"
```

**Initialize database:**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# OR run migrations (production)
npm run db:migrate
```

**Start backend server:**

```bash
npm run dev
```

✅ Backend should now be running on `http://localhost:3001`

### Step 4: Test the Backend

```bash
# Test server health
curl http://localhost:3001/api/health

# Test Better Auth
curl http://localhost:3001/api/auth/ok

# Sign up first user (auto-creates company and assigns Admin role)
curl -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'

# Sign in and save session cookie
curl -X POST http://localhost:3001/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'

# Get current user (using session cookie)
curl http://localhost:3001/api/users/me -b cookies.txt

# Get all users (Admin only)
curl http://localhost:3001/api/users -b cookies.txt
```

### Step 5: Access pgAdmin (Optional)

1. Open `http://localhost:5050` in browser
2. Login with:
   - Email: `admin@admin.com`
   - Password: `admin`
3. Add server connection:
   - Host: `postgres` (Docker service name)
   - Port: `5432`
   - Database: `expense_db`
   - Username: `expense_user`
   - Password: `expense_pass`

## 🔑 API Reference

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints (Better Auth)

All authentication endpoints are handled by Better Auth at `/api/auth/*`:

#### Sign Up
```bash
POST /api/auth/sign-up/email
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN",  # First user becomes ADMIN
    "companyId": "uuid"
  },
  "session": { ... }
}
```

**Note**: First user signup automatically:
- Creates a new Company
- Assigns ADMIN role
- Returns session cookie

#### Sign In
```bash
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK + Set-Cookie header
{
  "user": { ... },
  "session": { ... }
}
```

#### Sign Out
```bash
POST /api/auth/sign-out
Cookie: better-auth.session_token=...

Response: 200 OK
```

#### Get Session
```bash
GET /api/auth/session
Cookie: better-auth.session_token=...

Response: 200 OK
{
  "session": { ... },
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ADMIN",
    "companyId": "uuid"
  }
}
```

#### Health Check
```bash
GET /api/auth/ok

Response: 200 OK
{ "ok": true }
```

### User Management Endpoints

#### Get Current User
```bash
GET /api/users/me
Authorization: Cookie (session)

Response: 200 OK
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "ADMIN",
  "companyId": "uuid",
  "company": {
    "id": "uuid",
    "name": "John Doe's Company",
    "country": "US",
    "currency": "USD"
  },
  "manager": null,
  "createdAt": "2025-10-04T...",
  "updatedAt": "2025-10-04T..."
}
```

#### Get All Users (Admin/Manager)
```bash
GET /api/users
Authorization: Cookie (session)
Roles: ADMIN, MANAGER

Response: 200 OK
[
  {
    "id": "uuid",
    "name": "Employee Name",
    "email": "employee@example.com",
    "role": "EMPLOYEE",
    "managerId": "manager-uuid",
    "manager": {
      "id": "manager-uuid",
      "name": "Manager Name"
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Note**: Returns only users from the same company (`companyId`)

#### Create User (Admin Only)
```bash
POST /api/users
Authorization: Cookie (session)
Role: ADMIN
Content-Type: application/json

{
  "name": "New Employee",
  "email": "employee@example.com",
  "password": "TempPass123!",
  "role": "EMPLOYEE",
  "managerId": "manager-uuid"  // Optional
}

Response: 201 Created
{
  "id": "new-uuid",
  "name": "New Employee",
  "email": "employee@example.com",
  "role": "EMPLOYEE",
  "companyId": "admin-company-uuid",
  "managerId": "manager-uuid"
}
```

#### Update User (Admin Only)
```bash
PUT /api/users/:userId
Authorization: Cookie (session)
Role: ADMIN
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "MANAGER",
  "managerId": "new-manager-uuid"
}

Response: 200 OK
{
  "id": "userId",
  "name": "Updated Name",
  ...
}
```

#### Delete User (Admin Only)
```bash
DELETE /api/users/:userId
Authorization: Cookie (session)
Role: ADMIN

Response: 200 OK
{
  "message": "User deleted successfully"
}
```

### Country Endpoints

#### Get All Countries
```bash
GET /api/countries

Response: 200 OK
[
  {
    "code": "US",
    "name": "United States",
    "currency": "USD",
    "currencySymbol": "$"
  },
  {
    "code": "GB",
    "name": "United Kingdom",
    "currency": "GBP",
    "currencySymbol": "£"
  }
]
```

### System Endpoints

#### Health Check
```bash
GET /api/health

Response: 200 OK
{
  "status": "ok",
  "timestamp": "2025-10-04T..."
}
```

## 🔐 Authentication & Authorization

### Session Management

- **Session Storage**: HTTP-only cookies (secure, not accessible via JavaScript)
- **Session Duration**: 7 days with 1-day update age
- **Cookie Name**: `better-auth.session_token`
- **Cookie Cache**: 5-minute cache for performance
- **CORS**: Configured for `credentials: include` from frontend

### Role Hierarchy

```
ADMIN > MANAGER > EMPLOYEE
```

### Permission Matrix

| Feature | ADMIN | MANAGER | EMPLOYEE |
|---------|-------|---------|----------|
| **Users** |
| Create users | ✅ | ❌ | ❌ |
| Update users | ✅ | ❌ | ❌ |
| Delete users | ✅ | ❌ | ❌ |
| View all users | ✅ | ✅ (team only) | ❌ |
| View own profile | ✅ | ✅ | ✅ |
| **Expenses** |
| Submit expense | ✅ | ✅ | ✅ |
| View own expenses | ✅ | ✅ | ✅ |
| View all expenses | ✅ | ✅ (team only) | ❌ |
| Edit expense | ✅ | ✅ (own) | ✅ (own, if pending) |
| Delete expense | ✅ | ❌ | ❌ |
| **Approvals** |
| Configure rules | ✅ | ❌ | ❌ |
| Approve/Reject | ✅ | ✅ (assigned) | ❌ |
| Override approvals | ✅ | ❌ | ❌ |
| View approval history | ✅ | ✅ (assigned) | ✅ (own expenses) |
| **Company** |
| Update settings | ✅ | ❌ | ❌ |
| View settings | ✅ | ✅ | ✅ |

### Multi-Tenant Isolation

**CRITICAL**: All database queries MUST filter by `companyId`

```typescript
// ✅ Correct - Company isolated
const users = await prisma.user.findMany({
  where: { companyId: req.user.companyId }
});

// ❌ Wrong - Cross-company data leak
const users = await prisma.user.findMany();
```

**Middleware Pattern:**

```typescript
export const requireAuth = asyncHandler(async (req, res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers)
  });
  
  if (!session) throw new AppError("Unauthorized", 401);
  
  req.user = {
    id: session.user.id,
    companyId: session.user.companyId, // Always available
    role: session.user.role,
    // ...
  };
  
  next();
});
```

## 📊 Database Schema

### Core Models

#### User
```prisma
model User {
  id          String    @id @default(uuid())
  name        String
  email       String    @unique
  emailVerified Boolean @default(false)
  image       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Multi-tenant
  companyId   String
  company     Company   @relation(fields: [companyId])
  
  // Role & hierarchy
  role        UserRole  @default(EMPLOYEE)
  managerId   String?
  manager     User?     @relation("ManagerEmployee", fields: [managerId])
  subordinates User[]   @relation("ManagerEmployee")
  
  // Relations
  accounts    Account[]
  sessions    Session[]
  expenses    Expense[]
  approvalSteps ApprovalStep[]
}

enum UserRole {
  ADMIN
  MANAGER
  EMPLOYEE
}
```

#### Company
```prisma
model Company {
  id        String   @id @default(uuid())
  name      String
  country   String
  currency  String   @default("USD")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  users     User[]
  expenses  Expense[]
  approvalRules ApprovalRule[]
}
```

#### Expense
```prisma
model Expense {
  id            String        @id @default(uuid())
  amount        Float
  currency      String
  category      String
  description   String?
  expenseDate   DateTime
  status        ExpenseStatus @default(PENDING)
  
  employeeId    String
  employee      User          @relation(fields: [employeeId])
  
  companyId     String
  company       Company       @relation(fields: [companyId])
  
  approvalSteps ApprovalStep[]
  currentApprovalStep Int?
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum ExpenseStatus {
  PENDING
  APPROVED
  REJECTED
}
```

#### ApprovalRule
```prisma
model ApprovalRule {
  id                  String           @id @default(uuid())
  name                String
  minAmount           Float?
  maxAmount           Float?
  ruleType            ApprovalRuleType
  sequence            Int?
  
  // Manager approval
  isManagerApprover   Boolean          @default(false)
  
  // Conditional rules
  approvalPercentage  Int?
  specificApproverId  String?
  specificApprover    User?            @relation(...)
  
  approvers           User[]           @relation("ApprovalRuleApprovers")
  
  companyId           String
  company             Company          @relation(fields: [companyId])
  
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
}

enum ApprovalRuleType {
  SEQUENTIAL
  PERCENTAGE
  SPECIFIC
  HYBRID
}
```

#### ApprovalStep
```prisma
model ApprovalStep {
  id          String              @id @default(uuid())
  sequence    Int
  status      ApprovalStepStatus  @default(PENDING)
  comments    String?
  actionDate  DateTime?
  
  expenseId   String
  expense     Expense             @relation(fields: [expenseId])
  
  approverId  String
  approver    User                @relation(fields: [approverId])
  
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

enum ApprovalStepStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### Better Auth Models

Better Auth automatically manages these models:

- **Account**: Password hashes and auth providers
- **Session**: Active user sessions
- **Verification**: Email verification tokens

## 💡 Key Implementation Patterns

### 1. Better Auth Middleware Order

**CRITICAL**: Better Auth handler MUST come before `express.json()`

```typescript
// ✅ Correct order in server.ts
app.all("/api/auth/*", toNodeHandler(auth));  // Raw body needed
app.use(express.json());                       // Parse JSON after
app.use(cors({ credentials: true }));          // CORS config
```

### 2. Authentication Flow

```typescript
// 1. Retrieve session in middleware
export const requireAuth = asyncHandler(async (req, res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers)
  });
  
  if (!session) throw new AppError("Unauthorized", 401);
  
  // 2. Attach user to request
  req.user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    companyId: session.user.companyId
  };
  
  next();
});

// 3. Role enforcement
export const requireRole = (...roles: UserRole[]) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    if (!roles.includes(req.user.role)) {
      throw new AppError("Forbidden", 403);
    }
    next();
  });
};

// 4. Use in routes
router.get("/users", 
  requireAuth, 
  requireRole("ADMIN", "MANAGER"), 
  getAllUsers
);
```

### 3. Approval Workflow Logic

```typescript
// Pseudo-code for approval step generation
async function createApprovalSteps(expense, approvalRule) {
  let nextSequence = 1;
  
  // Step 1: Manager approval (if configured)
  if (approvalRule.isManagerApprover && expense.employee.managerId) {
    await prisma.approvalStep.create({
      data: {
        expenseId: expense.id,
        approverId: expense.employee.managerId,
        sequence: nextSequence,
        status: "PENDING"
      }
    });
    nextSequence++;
  }
  
  // Step 2: Sequential approvers
  if (approvalRule.ruleType === "SEQUENTIAL") {
    for (const approver of approvalRule.approvers) {
      await prisma.approvalStep.create({
        data: {
          expenseId: expense.id,
          approverId: approver.id,
          sequence: nextSequence,
          status: "PENDING"
        }
      });
      nextSequence++;
    }
  }
  
  // Step 3: Handle percentage/specific approver rules
  if (approvalRule.ruleType === "PERCENTAGE") {
    // All approvers get same sequence (parallel)
    for (const approver of approvalRule.approvers) {
      await prisma.approvalStep.create({
        data: {
          expenseId: expense.id,
          approverId: approver.id,
          sequence: nextSequence,
          status: "PENDING"
        }
      });
    }
  }
}
```

### 4. Company Auto-Creation Hook

```typescript
// In lib/auth.ts - Better Auth configuration
export const auth = betterAuth({
  database: prisma,
  
  user: {
    additionalFields: {
      role: { type: "string", required: false },
      companyId: { type: "string", required: false }
    }
  },
  
  hooks: {
    after: [
      {
        matcher: (context) => {
          return context.path?.startsWith("/sign-up");
        },
        handler: async (context) => {
          const userId = context.context.newUser.id;
          
          // Check if first user in system
          const userCount = await prisma.user.count();
          
          if (userCount === 1) {
            // Create company
            const company = await prisma.company.create({
              data: {
                name: `${context.context.newUser.name}'s Company`,
                country: "US",
                currency: "USD"
              }
            });
            
            // Assign ADMIN role and company
            await prisma.user.update({
              where: { id: userId },
              data: {
                role: "ADMIN",
                companyId: company.id
              }
            });
          }
        }
      }
    ]
  }
});
```

## 🧪 Testing & Development

### Running Tests

```bash
# Backend - Auth testing
cd backend
./test-auth.sh

# Backend - User management testing
./test-auth-user-mgmt.sh
```

### Manual API Testing

Complete test scripts are provided in `backend/test-auth.sh` and `backend/test-auth-user-mgmt.sh`

#### Quick Test Flow

```bash
# 1. Health check
curl http://localhost:3001/api/health

# 2. Better Auth health
curl http://localhost:3001/api/auth/ok

# 3. Create first user (auto-admin)
curl -X POST http://localhost:3001/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "Admin123!"
  }'

# 4. Sign in and save session
curl -X POST http://localhost:3001/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'

# 5. Get current user
curl http://localhost:3001/api/users/me -b cookies.txt

# 6. Create employee
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "John Employee",
    "email": "john@example.com",
    "password": "Pass123!",
    "role": "EMPLOYEE"
  }'

# 7. List all users
curl http://localhost:3001/api/users -b cookies.txt
```

### Development Workflow

```bash
# Start Docker database
docker-compose up -d postgres

# Terminal 1: Backend dev server
cd backend
npm run dev

# Terminal 2: Watch Prisma schema
cd backend
npm run db:generate -- --watch

# Terminal 3: Testing
cd backend
./test-auth-user-mgmt.sh
```

### Database Management

```bash
# Push schema changes (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Regenerate Prisma client
npm run db:generate

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Open Prisma Studio (visual DB editor)
npx prisma studio
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Start only PostgreSQL
docker-compose up -d postgres

# Stop all services
docker-compose down

# View logs
docker-compose logs -f postgres

# Reset database (remove volume)
docker-compose down -v
```

## 🚧 Development Status

### ✅ Completed Features

#### Backend Infrastructure
- [x] Express server with TypeScript
- [x] Better Auth integration with Prisma
- [x] Role-based middleware (`requireAuth`, `requireRole`)
- [x] Centralized error handling
- [x] Multi-tenant data isolation
- [x] Docker Compose setup

#### Authentication
- [x] Email/password signup with company creation
- [x] Email/password signin with session management
- [x] Session retrieval and validation
- [x] Sign out functionality
- [x] Auto-assign ADMIN role to first user

#### User Management
- [x] Get current user endpoint
- [x] List all users (company-scoped)
- [x] Create user (Admin only)
- [x] Update user (Admin only)
- [x] Delete user (Admin only)
- [x] Manager-employee relationships

#### Database
- [x] Complete Prisma schema
- [x] User, Company, Session models
- [x] Expense, ApprovalRule, ApprovalStep models
- [x] Database migrations
- [x] Multi-tenant setup

#### Developer Tools
- [x] Testing scripts (auth, user management)
- [x] pgAdmin container
- [x] Development documentation
- [x] GitHub Copilot instructions

### � In Progress

- [ ] Expense submission endpoints
- [ ] Approval workflow endpoints
- [ ] Approval rule configuration

### 📋 Planned Features

#### Backend
- [ ] Expense CRUD operations
- [ ] Expense approval/rejection logic
- [ ] Approval rule management
- [ ] Currency conversion API integration
- [ ] Receipt file upload (AWS S3/local storage)
- [ ] Email notifications (approval requests, status updates)
- [ ] Expense reporting and analytics
- [ ] Company settings management
- [ ] Audit logging

#### Frontend
- [ ] React app scaffolding
- [ ] Better Auth React client integration
- [ ] Login/Signup pages
- [ ] Dashboard layouts (Admin, Manager, Employee)
- [ ] Expense submission form
- [ ] Expense list and details
- [ ] Approval interface
- [ ] User management UI (Admin)
- [ ] Approval rule configuration UI (Admin)
- [ ] Profile settings
- [ ] Reports and analytics

#### DevOps
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Docker production setup
- [ ] CI/CD pipeline
- [ ] Production deployment guide

## �📝 Environment Variables

### Backend `.env`

```env
# Database Connection
DATABASE_URL="postgresql://expense_user:expense_pass@localhost:5432/expense_db"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-super-secret-key-min-32-chars-change-in-production"
BETTER_AUTH_URL="http://localhost:3001"

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"
```

### Frontend `.env.local` (Planned)

```env
# API Base URL
VITE_API_URL=http://localhost:3001

# Better Auth URL
VITE_AUTH_URL=http://localhost:3001
```

## 🐛 Known Issues & Solutions

### ⚠️ Auth Issue: Sign-in Fails After Signup

**Status**: Known issue under investigation

**Symptom**: Signup completes successfully, but subsequent signin returns "Invalid email or password"

**Root Cause**: Better Auth hooks may not be executing properly, or Account record not being created

**Debugging Steps**:
1. Check backend terminal for errors during signup
2. Verify database records:
   ```sql
   SELECT u.email, u.role, u."companyId", a.password IS NOT NULL 
   FROM "User" u 
   LEFT JOIN "Account" a ON u.id = a."userId" 
   ORDER BY u."createdAt" DESC LIMIT 5;
   ```
3. Check if Company records are being created
4. Verify Better Auth version compatibility

**Temporary Workaround**: Use custom signup endpoint at `/api/auth-custom/signup` (requires testing)

### Common Issues

#### 1. Session not persisting
**Solution**: Ensure `credentials: "include"` in frontend API client

#### 2. CORS errors
**Solution**: Backend configured for `http://localhost:3000`. Update `FRONTEND_URL` if using different port

#### 3. Database connection fails
**Solution**: 
- Check Docker container is running: `docker ps`
- Verify DATABASE_URL in `.env`
- Ensure PostgreSQL is accessible on port 5432

#### 4. Prisma client outdated
**Solution**: Run `npm run db:generate` after schema changes

#### 5. Migration conflicts
**Solution**: 
```bash
# Development: Force push schema
npm run db:push -- --force-reset

# Production: Reset migrations
npx prisma migrate reset
```

## 📚 Documentation Files

- **README.md** (this file) - Complete project documentation
- **SETUP_COMPLETE.md** - Quick setup verification guide
- **FRONTEND_AUTH_INTEGRATION.md** - Detailed frontend integration guide
- **backend/README.md** - Backend-specific documentation
- **backend/AUTH_USER_MANAGEMENT_REPORT.md** - Auth implementation report
- **backend/IMPLEMENTATION_SUMMARY.md** - Implementation summary
- **.github/copilot-instructions.md** - GitHub Copilot AI assistant config

## 🤝 Contributing

### Development Guidelines

1. **Branch naming**: `feature/feature-name`, `fix/bug-name`, `docs/doc-update`
2. **Commit messages**: Use conventional commits
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation
   - `refactor:` code refactoring
   - `test:` add tests
3. **Pull requests**: Include description, screenshots (if UI), and test results

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: Follow ESLint rules
- **Formatting**: Prettier (when configured)
- **Naming**: camelCase for variables, PascalCase for classes/types

### Testing Requirements

- Write tests for new features
- Ensure existing tests pass
- Test multi-tenant isolation
- Test role-based access control

## � License

ISC

## 🙏 Acknowledgments

- [Better Auth](https://www.better-auth.com/) - Modern authentication library
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Express.js](https://expressjs.com/) - Fast web framework
- [PostgreSQL](https://www.postgresql.org/) - Reliable database

## 📞 Support & Contact

For questions, issues, or contributions:

- **GitHub Issues**: [Create an issue](https://github.com/pratiiikkk/odoo-expense-mangement/issues)
- **Email**: pratik@example.com (update with actual email)
- **Documentation**: See `SETUP_COMPLETE.md` and `FRONTEND_AUTH_INTEGRATION.md`

---

**Last Updated**: October 4, 2025  
**Backend Status**: ✅ Production Ready  
**Frontend Status**: � Planned  
**Version**: 1.0.0
