'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { approvalService } from '@/services/api';
import { Expense, ExpenseStatus } from '@/types';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ApprovalsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const data = await approvalService.getPendingApprovals();
      console.log('Pending approvals data:', data); // Debug log
      setExpenses(data || []);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch pending approvals:', err);
      setError(err.response?.data?.message || 'Failed to load pending approvals');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleAction = async (expense: Expense, actionType: 'approve' | 'reject') => {
    setSelectedExpense(expense);
    setAction(actionType);
    setComments('');
    setError('');
    setDialogOpen(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedExpense || !action) return;

    if (action === 'reject' && !comments.trim()) {
      setError('Comments are required when rejecting an expense');
      return;
    }

    // Check if we have approvalStepId (required by backend)
    if (!selectedExpense.approvalStepId) {
      setError('Missing approval step ID. Please refresh and try again.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await approvalService.approveOrReject(selectedExpense.approvalStepId, {
        action,
        comments: comments.trim() || undefined,
      });
      setDialogOpen(false);
      fetchPendingApprovals();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process approval');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading pending approvals...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Pending Approvals</h2>
        <p className="text-muted-foreground">
          Review and approve expense claims awaiting your decision
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expenses Awaiting Approval</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses pending your approval at this time.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {expense.employee.name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {expense.description || '-'}
                    </TableCell>
                    <TableCell>
                      {expense.company.currency}{' '}
                      {(expense.convertedAmount ?? expense.amount).toFixed(2)}
                      {expense.currency !== expense.company.currency && (
                        <div className="text-xs text-muted-foreground">
                          ({expense.currency} {expense.amount.toFixed(2)})
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        Step {expense.currentApprovalStep}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAction(expense, 'approve')}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(expense, 'reject')}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Expense' : 'Reject Expense'}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense && (
                <div className="mt-4 space-y-2">
                  <div>
                    <strong>Employee:</strong> {selectedExpense.employee.name}
                  </div>
                  <div>
                    <strong>Category:</strong> {selectedExpense.category}
                  </div>
                  <div>
                    <strong>Amount:</strong> {selectedExpense.company.currency}{' '}
                    {(selectedExpense.convertedAmount ?? selectedExpense.amount).toFixed(2)}
                  </div>
                  <div>
                    <strong>Description:</strong>{' '}
                    {selectedExpense.description || 'N/A'}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="comments">
                Comments {action === 'reject' && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="comments"
                placeholder={
                  action === 'approve'
                    ? 'Add optional comments...'
                    : 'Provide reason for rejection...'
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                required={action === 'reject'}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant={action === 'approve' ? 'default' : 'destructive'}
                onClick={handleSubmitAction}
                disabled={submitting}
                className="flex-1"
              >
                {submitting
                  ? 'Processing...'
                  : action === 'approve'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
