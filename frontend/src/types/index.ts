// Enums matching backend
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ApprovalRuleType {
  SEQUENTIAL = 'SEQUENTIAL',
  PERCENTAGE = 'PERCENTAGE',
  SPECIFIC = 'SPECIFIC',
  HYBRID = 'HYBRID',
}

export enum ApprovalStepStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  managerId?: string;
  manager?: User;
  createdAt: string;
  updatedAt: string;
}

// Company Types
export interface Company {
  id: string;
  name: string;
  country: string;
  currency: string;
  createdAt: string;
}

// Expense Types
export interface Expense {
  id: string;
  amount: number;
  currency: string;
  convertedAmount?: number; // Optional - may not be present in all responses
  category: string;
  description?: string;
  expenseDate: string;
  status: ExpenseStatus;
  employeeId: string;
  employee: User;
  companyId: string;
  company: Company;
  currentApprovalStep: number;
  approvalSteps: ApprovalStep[];
  approvalStepId?: string; // For pending approvals - the specific step ID to approve/reject
  createdAt: string;
  updatedAt: string;
}

// Approval Step Types
export interface ApprovalStep {
  id: string;
  expenseId: string;
  approverId: string;
  approver: User;
  status: ApprovalStepStatus;
  sequence: number;
  comments?: string;
  actionDate?: string;
  createdAt: string;
}

// Rule Approver Type
export interface RuleApprover {
  id: string;
  approvalRuleId: string;
  approverId: string;
  approver: User;
  sequence: number;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

// Approval Rule Types
export interface ApprovalRule {
  id: string;
  name: string;
  companyId: string;
  ruleType: ApprovalRuleType;
  isManagerApprover: boolean;
  approversSequenceEnabled: boolean; // New field
  approvers?: User[]; // Optional - deprecated, use ruleApprovers
  ruleApprovers?: RuleApprover[]; // New field - multiple approvers
  approvalPercentage?: number;
  specificApproverId?: string;
  specificApprover?: User;
  thresholdAmount?: number;
  sequence: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface SignupData {
  name: string;
  email: string;
  password: string;
  companyName: string;
  country: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  company: Company;
  token?: string;
}

// Create Expense
export interface CreateExpenseData {
  amount: number;
  currency: string;
  category: string;
  description?: string;
  expenseDate: string;
}

// Create User (Admin)
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  managerId?: string;
}

// Approval Action
export interface ApprovalActionData {
  action: 'approve' | 'reject';
  comments?: string;
}

// Country Type
export interface Country {
  country: string;
  currencyCode: string;
}
