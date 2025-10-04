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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Power } from 'lucide-react';
import { approvalRuleService, userService } from '@/services/api';
import { ApprovalRule, ApprovalRuleType, User, UserRole } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ApprovalRulesPage() {
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    ruleType: ApprovalRuleType.SEQUENTIAL,
    isManagerApprover: false,
    approverIds: [] as string[],
    approvalPercentage: undefined as number | undefined,
    specificApproverId: undefined as string | undefined,
    sequence: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [rulesData, usersData] = await Promise.all([
        approvalRuleService.getAllRules(),
        userService.getAllUsers(),
      ]);
      setRules(rulesData || []);
      setUsers((usersData || []).filter((u) => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN));
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setRules([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await approvalRuleService.createRule(formData);
      setDialogOpen(false);
      setFormData({
        name: '',
        ruleType: ApprovalRuleType.SEQUENTIAL,
        isManagerApprover: false,
        approverIds: [],
        approvalPercentage: undefined,
        specificApproverId: undefined,
        sequence: 1,
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create approval rule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (ruleId: string) => {
    try {
      await approvalRuleService.toggleRuleStatus(ruleId);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to toggle rule status');
      setErrorDialogOpen(true);
    }
  };

  const handleDelete = async (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteError('');
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!ruleToDelete) return;

    setDeleting(true);
    setDeleteError('');

    try {
      await approvalRuleService.deleteRule(ruleToDelete);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
      fetchData();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete rule');
    } finally {
      setDeleting(false);
    }
  };

  const getRuleTypeBadge = (type: ApprovalRuleType) => {
    const variants: Record<ApprovalRuleType, string> = {
      SEQUENTIAL: 'default',
      PERCENTAGE: 'secondary',
      SPECIFIC: 'outline',
      HYBRID: 'destructive',
    };
    return <Badge variant={variants[type] as any}>{type}</Badge>;
  };

  const toggleApprover = (approverId: string) => {
    setFormData((prev) => ({
      ...prev,
      approverIds: prev.approverIds.includes(approverId)
        ? prev.approverIds.filter((id) => id !== approverId)
        : [...prev.approverIds, approverId],
    }));
  };

  if (loading) {
    return <div>Loading approval rules...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Approval Rules</h2>
          <p className="text-muted-foreground">
            Configure approval workflows for expense management
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Approval Rule</DialogTitle>
              <DialogDescription>
                Define a new approval workflow for expenses
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Standard Approval Flow"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ruleType">Rule Type</Label>
                <Select
                  value={formData.ruleType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ruleType: value as ApprovalRuleType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ApprovalRuleType.SEQUENTIAL}>
                      Sequential (All approvers in order)
                    </SelectItem>
                    <SelectItem value={ApprovalRuleType.PERCENTAGE}>
                      Percentage (Min % required)
                    </SelectItem>
                    <SelectItem value={ApprovalRuleType.SPECIFIC}>
                      Specific (One designated approver)
                    </SelectItem>
                    <SelectItem value={ApprovalRuleType.HYBRID}>
                      Hybrid (Percentage OR Specific)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isManagerApprover"
                  checked={formData.isManagerApprover}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isManagerApprover: checked as boolean })
                  }
                />
                <Label htmlFor="isManagerApprover" className="cursor-pointer">
                  Require manager approval first
                </Label>
              </div>

              {(formData.ruleType === ApprovalRuleType.SEQUENTIAL ||
                formData.ruleType === ApprovalRuleType.PERCENTAGE ||
                formData.ruleType === ApprovalRuleType.HYBRID) && (
                <div className="space-y-2">
                  <Label>Select Approvers</Label>
                  <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                    {users?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No managers/admins available
                      </p>
                    ) : (
                      users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`approver-${user.id}`}
                            checked={formData.approverIds.includes(user.id)}
                            onCheckedChange={() => toggleApprover(user.id)}
                          />
                          <Label
                            htmlFor={`approver-${user.id}`}
                            className="cursor-pointer flex-1"
                          >
                            {user.name} ({user.role})
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {(formData.ruleType === ApprovalRuleType.PERCENTAGE ||
                formData.ruleType === ApprovalRuleType.HYBRID) && (
                <div className="space-y-2">
                  <Label htmlFor="approvalPercentage">
                    Approval Percentage (%)
                  </Label>
                  <Input
                    id="approvalPercentage"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g., 60"
                    value={formData.approvalPercentage || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        approvalPercentage: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              )}

              {(formData.ruleType === ApprovalRuleType.SPECIFIC ||
                formData.ruleType === ApprovalRuleType.HYBRID) && (
                <div className="space-y-2">
                  <Label htmlFor="specificApproverId">Specific Approver</Label>
                  <Select
                    value={formData.specificApproverId || ''}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        specificApproverId: value || undefined,
                      })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specific approver" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sequence">Rule Sequence</Label>
                <Input
                  id="sequence"
                  type="number"
                  min="1"
                  value={formData.sequence}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sequence: parseInt(e.target.value),
                    })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers are evaluated first
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Rule'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Rules ({rules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rules?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approval rules configured yet. Create your first rule to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Manager First</TableHead>
                  <TableHead>Approvers</TableHead>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{getRuleTypeBadge(rule.ruleType)}</TableCell>
                    <TableCell>
                      {rule.isManagerApprover ? (
                        <Badge variant="secondary">Yes</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {(rule.approvers?.length ?? 0) > 0
                        ? `${rule.approvers?.length} approver(s)`
                        : rule.specificApprover?.name || (rule.isManagerApprover ? 'Manager' : '-')}
                    </TableCell>
                    <TableCell>{rule.sequence}</TableCell>
                    <TableCell>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(rule.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Approval Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this approval rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setErrorDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
