# Expense Management System - FrontendThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



Modern expense management application built with Next.js 15, TypeScript, and shadcn/ui.## Getting Started



## FeaturesFirst, run the development server:



### 🔐 Authentication```bash

- User signup with company creationnpm run dev

- Secure login with cookie-based sessions# or

- Role-based access control (Admin, Manager, Employee)yarn dev

# or

### 💰 Expense Managementpnpm dev

- Submit expenses with multi-currency support# or

- Automatic currency conversionbun dev

- Category-based expense tracking```

- View expense history and status

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### ✅ Approval Workflows

- Multi-level sequential approvalsYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

- Configurable approval rules:

  - **Sequential**: All approvers in orderThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

  - **Percentage**: Minimum percentage required

  - **Specific**: Designated approver## Learn More

  - **Hybrid**: Combination of rules

- Manager-first approval optionTo learn more about Next.js, take a look at the following resources:

- Approval history tracking

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

### 👥 User Management (Admin)- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

- Create and manage team members

- Assign roles and managersYou can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- Define reporting hierarchy

## Deploy on Vercel

### ⚙️ Approval Rules Configuration (Admin)

- Create custom approval workflowsThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

- Configure approver sequences

- Set percentage thresholdsCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

- Toggle rule status

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend server running on `http://localhost:3001`

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Update .env.local with your backend URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Run development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js app router pages
│   │   ├── dashboard/                # Dashboard pages
│   │   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   │   ├── page.tsx             # Dashboard home
│   │   │   ├── expenses/            # Expense management
│   │   │   ├── approvals/           # Approval management
│   │   │   ├── users/               # User management (Admin)
│   │   │   └── approval-rules/      # Rule configuration (Admin)
│   │   ├── login/                   # Login page
│   │   ├── signup/                  # Signup page
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Landing page
│   ├── components/
│   │   └── ui/                      # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication context
│   ├── services/
│   │   └── api.ts                   # API service functions
│   ├── lib/
│   │   ├── api.ts                   # Axios client setup
│   │   └── utils.ts                 # Utility functions
│   └── types/
│       └── index.ts                 # TypeScript types
├── public/                           # Static assets
└── package.json
```

## User Roles & Permissions

### Admin
- Full company access
- Create and manage users
- Configure approval rules
- View all expenses
- Override approvals

### Manager
- Approve/reject expenses
- View team expenses
- Add approval comments
- Escalate per configured rules

### Employee
- Submit expenses
- View own expense history
- Check approval status
- Cannot view other employees' expenses

## Hackathon Demo Guide

### Demo Flow

1. **Landing Page** (`/`)
   - Show key features and value proposition
   - Sign up for new account

2. **Signup** (`/signup`)
   - Create company account (first user becomes Admin)
   - Select country for currency

3. **Dashboard** (`/dashboard`)
   - Overview of expense statistics
   - Quick actions

4. **Submit Expense** (`/dashboard/expenses`)
   - Employee submits expense with category, amount, currency
   - Show automatic currency conversion

5. **User Management** (`/dashboard/users`)
   - Admin creates Manager and Employees
   - Assign reporting hierarchy

6. **Approval Rules** (`/dashboard/approval-rules`)
   - Configure sequential approval workflow
   - Enable manager approval
   - Add multiple approvers

7. **Approvals** (`/dashboard/approvals`)
   - Manager reviews pending expenses
   - Approve/reject with comments
   - Show sequential approval flow

### Key Demo Points

✅ **Multi-Tenant**: Each company has isolated data  
✅ **Multi-Currency**: Automatic conversion to company currency  
✅ **Flexible Workflows**: Sequential, Percentage, Specific, Hybrid rules  
✅ **Role-Based**: Admin, Manager, Employee permissions  
✅ **Modern UI**: Clean, responsive design with shadcn/ui  
✅ **Type-Safe**: Full TypeScript implementation  

## License

MIT
