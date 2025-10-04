import apiClient from '@/lib/api';
import {
  SignupData,
  LoginData,
  AuthResponse,
  User,
  CreateUserData,
  Expense,
  CreateExpenseData,
  ApprovalActionData,
  ApprovalRule,
  Country,
} from '@/types';

// Helper function to transform backend expense to frontend format
const transformExpense = (expense: any): Expense => {
  return {
    ...expense,
    expenseDate: expense.date || expense.expenseDate, // Map 'date' to 'expenseDate'
  };
};

// Auth Services
export const authService = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth-custom/signup', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<{ user: User }> => {
    const response = await apiClient.post('/auth/sign-in/email', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/sign-out');
  },

  getSession: async (): Promise<{ user: User } | null> => {
    try {
      const response = await apiClient.get('/session');
      return response.data;
    } catch (error) {
      return null;
    }
  },
};

// User Services
export const userService = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data.user;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/users');
    return response.data; // Backend returns array directly, not { users: [...] }
  },

  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await apiClient.post('/users', data);
    return response.data.user;
  },

  updateUser: async (userId: string, data: Partial<CreateUserData>): Promise<User> => {
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data.user;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },
};

// Expense Services
export const expenseService = {
  submitExpense: async (data: CreateExpenseData): Promise<Expense> => {
    // Map frontend field names to backend expected names
    const requestData = {
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      description: data.description,
      date: data.expenseDate, // Backend expects 'date', frontend uses 'expenseDate'
    };
    const response = await apiClient.post('/expenses', requestData);
    return transformExpense(response.data.expense);
  },

  getMyExpenses: async (status?: string): Promise<Expense[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/expenses/my-expenses', { params });
    return (response.data.expenses || []).map(transformExpense);
  },

  getAllExpenses: async (status?: string): Promise<Expense[]> => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/expenses', { params });
    return (response.data.expenses || []).map(transformExpense);
  },

  getExpenseById: async (expenseId: string): Promise<Expense> => {
    const response = await apiClient.get(`/expenses/${expenseId}`);
    return transformExpense(response.data.expense);
  },

  updateExpense: async (expenseId: string, data: Partial<CreateExpenseData>): Promise<Expense> => {
    // Map frontend field names to backend expected names
    const requestData: any = {
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      description: data.description,
    };
    if (data.expenseDate) {
      requestData.date = data.expenseDate; // Backend expects 'date'
    }
    const response = await apiClient.put(`/expenses/${expenseId}`, requestData);
    return transformExpense(response.data.expense);
  },

  deleteExpense: async (expenseId: string): Promise<void> => {
    await apiClient.delete(`/expenses/${expenseId}`);
  },
};

// Approval Services
export const approvalService = {
  getPendingApprovals: async (): Promise<Expense[]> => {
    const response = await apiClient.get('/approvals/pending');
    // Backend returns {approvals: [{expense: {...}, approvalStepId: ...}]}
    const approvals = response.data.approvals || [];
    return approvals.map((approval: any) => ({
      ...transformExpense(approval.expense),
      approvalStepId: approval.approvalStepId,
      currentApprovalStep: approval.currentStep,
    }));
  },

  approveOrReject: async (expenseId: string, data: ApprovalActionData): Promise<void> => {
    // Note: Backend expects approvalStepId, but we're passing expenseId
    // The page should be updated to use approvalStepId from the expense object
    const endpoint = data.action === 'approve' 
      ? `/approvals/${expenseId}/approve`
      : `/approvals/${expenseId}/reject`;
    await apiClient.post(endpoint, { comments: data.comments });
  },

  getApprovalHistory: async (expenseId: string): Promise<any> => {
    const response = await apiClient.get(`/approvals/${expenseId}/history`);
    return response.data;
  },
};

// Approval Rule Services
export const approvalRuleService = {
  getAllRules: async (): Promise<ApprovalRule[]> => {
    const response = await apiClient.get('/approval-rules');
    return response.data.rules;
  },

  createRule: async (data: any): Promise<ApprovalRule> => {
    const response = await apiClient.post('/approval-rules', data);
    return response.data.rule;
  },

  updateRule: async (ruleId: string, data: any): Promise<ApprovalRule> => {
    const response = await apiClient.put(`/approval-rules/${ruleId}`, data);
    return response.data.rule;
  },

  deleteRule: async (ruleId: string): Promise<void> => {
    await apiClient.delete(`/approval-rules/${ruleId}`);
  },

  toggleRuleStatus: async (ruleId: string): Promise<ApprovalRule> => {
    const response = await apiClient.patch(`/approval-rules/${ruleId}/toggle`);
    return response.data.rule;
  },
};

// Country Services
export const countryService = {
  getAllCountries: async (): Promise<Country[]> => {
    const response = await apiClient.get('/countries/unique');
    return response.data.countries;
  },
};

// Dashboard Services
export const dashboardService = {
  getStats: async (): Promise<{
    totalExpenses: number;
    pendingExpenses: number;
    approvedExpenses: number;
    rejectedExpenses: number;
    pendingApprovals: number;
    teamMembers: number;
  }> => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },
};
