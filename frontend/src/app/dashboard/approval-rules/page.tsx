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
import { Plus, Trash2, Power, GripVertical, X } from 'lucide-react';
import { approvalRuleService, userService } from '@/services/api';
import { ApprovalRule, ApprovalRuleType, User, UserRole } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Type for approver with sequence
interface ApproverWithSequence {
  approverId: string;
  sequence: number;
  isRequired: boolean;
}

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
    approversSequenceEnabled: true,
    approvers: [] as ApproverWithSequence[],
    approvalPercentage: undefined as number | undefined,
    specificApproverId: undefined as string | undefined,
    thresholdAmount: undefined as number | undefined,
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
        approversSequenceEnabled: true,
        approvers: [],
        approvalPercentage: undefined,
        specificApproverId: undefined,
        thresholdAmount: undefined,
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

  const addApprover = (approverId: string) => {
    if (formData.approvers.some(a => a.approverId === approverId)) return;
    
    const nextSequence = formData.approvers.length > 0 
      ? Math.max(...formData.approvers.map(a => a.sequence)) + 1 
      : 1;

    setFormData((prev) => ({
      ...prev,
      approvers: [...prev.approvers, { approverId, sequence: nextSequence, isRequired: false }],
    }));
  };

  const removeApprover = (approverId: string) => {
    setFormData((prev) => ({
      ...prev,
      approvers: prev.approvers.filter(a => a.approverId !== approverId),
    }));
  };

  const moveApproverUp = (index: number) => {
    if (index === 0) return;
    const newApprovers = [...formData.approvers];
    [newApprovers[index - 1], newApprovers[index]] = [newApprovers[index], newApprovers[index - 1]];
    // Update sequences
    newApprovers.forEach((approver, idx) => {
      approver.sequence = idx + 1;
    });
    setFormData(prev => ({ ...prev, approvers: newApprovers }));
  };

  const moveApproverDown = (index: number) => {
    if (index === formData.approvers.length - 1) return;
    const newApprovers = [...formData.approvers];
    [newApprovers[index], newApprovers[index + 1]] = [newApprovers[index + 1], newApprovers[index]];
    // Update sequences
    newApprovers.forEach((approver, idx) => {
      approver.sequence = idx + 1;
    });
    setFormData(prev => ({ ...prev, approvers: newApprovers }));
  };

  const toggleRequired = (approverId: string) => {
    setFormData((prev) => ({
      ...prev,
      approvers: prev.approvers.map(a =>
        a.approverId === approverId ? { ...a, isRequired: !a.isRequired } : a
      ),
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
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="approversSequenceEnabled"
                      checked={formData.approversSequenceEnabled}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, approversSequenceEnabled: checked as boolean })
                      }
                    />
                    <Label htmlFor="approversSequenceEnabled" className="cursor-pointer">
                      Process approvers sequentially (one by one)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-2">
                    If unchecked, all approvers will receive requests simultaneously
                  </p>

                  <div className="space-y-2">
                    <Label>Approvers</Label>
                    
                    {/* Current Approvers List */}
                    {formData.approvers.length > 0 && (
                      <div className="border rounded-md p-3 space-y-2 mb-2">
                        {formData.approvers.map((approver, index) => {
                          const user = users.find(u => u.id === approver.approverId);
                          return (
                            <div key={approver.approverId} className="flex items-center gap-2 p-2 bg-secondary rounded">
                              <span className="font-mono text-sm w-6">{approver.sequence}</span>
                              <div className="flex-1">
                                <span className="font-medium">{user?.name}</span>
                                <span className="text-sm text-muted-foreground ml-2">({user?.role})</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveApproverUp(index)}
                                  disabled={index === 0 || !formData.approversSequenceEnabled}
                                >
                                  ↑
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveApproverDown(index)}
                                  disabled={index === formData.approvers.length - 1 || !formData.approversSequenceEnabled}
                                >
                                  ↓
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeApprover(approver.approverId)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Approvers Dropdown */}
                    <Select
                      onValueChange={(value) => {
                        addApprover(value);
                      }}
                      value=""
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add approver..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(u => !formData.approvers.some(a => a.approverId === u.id))
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.role})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
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
                  <p className="text-xs text-muted-foreground">
                    Expense auto-approved when this % of approvers approve
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    This approver's approval alone can auto-approve the expense
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="thresholdAmount">Threshold Amount (Optional)</Label>
                <Input
                  id="thresholdAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 1000"
                  value={formData.thresholdAmount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      thresholdAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Rule applies only when expense amount meets or exceeds this threshold
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sequence">Rule Priority</Label>
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
                  <TableHead>Workflow</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Approvers</TableHead>
                  <TableHead>Priority</TableHead>
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
                      <div className="space-y-1">
                        {rule.isManagerApprover && (
                          <Badge variant="outline" className="text-xs">Manager First</Badge>
                        )}
                        {rule.approversSequenceEnabled ? (
                          <Badge variant="secondary" className="text-xs">Sequential</Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">Parallel</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rule.thresholdAmount ? `≥ ${rule.thresholdAmount}` : 'All'}
                    </TableCell>
                    <TableCell>
                      {rule.ruleApprovers && rule.ruleApprovers.length > 0 ? (
                        <div className="text-sm">
                          {rule.ruleApprovers.length} approver(s)
                          {rule.ruleApprovers.length <= 3 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {rule.ruleApprovers.map(ra => ra.approver.name).join(', ')}
                            </div>
                          )}
                        </div>
                      ) : rule.specificApprover ? (
                        <div className="text-sm">
                          {rule.specificApprover.name}
                          <div className="text-xs text-muted-foreground">Specific</div>
                        </div>
                      ) : rule.isManagerApprover ? (
                        <div className="text-sm text-muted-foreground">Manager</div>
                      ) : (
                        '-'
                      )}
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
