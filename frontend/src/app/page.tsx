'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Receipt, Users, CheckSquare, TrendingUp } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Receipt className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold">Expense Manager</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Multi-tenant expense management system with powerful approval workflows
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">Sign In</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <Card>
            <CardHeader>
              <Receipt className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Easy Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Submit expenses with multi-currency support and automatic conversion</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CheckSquare className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Smart Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Configurable workflows with sequential, percentage, and hybrid rules</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Role-based access control with admin, manager, and employee roles</CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Multi-Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Complete data isolation with company-level organization</CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Key Features</CardTitle>
            <CardDescription>Everything you need to manage expenses efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckSquare className="h-5 w-5 text-primary mt-0.5" />
                <span>Multi-level sequential approvals with manager hierarchy</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckSquare className="h-5 w-5 text-primary mt-0.5" />
                <span>Flexible approval rules: Sequential, Percentage, Specific, and Hybrid</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckSquare className="h-5 w-5 text-primary mt-0.5" />
                <span>Multi-currency support with automatic conversion</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckSquare className="h-5 w-5 text-primary mt-0.5" />
                <span>Role-based permissions for Admin, Manager, and Employee</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckSquare className="h-5 w-5 text-primary mt-0.5" />
                <span>Real-time expense tracking and approval status</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckSquare className="h-5 w-5 text-primary mt-0.5" />
                <span>Complete company data isolation (multi-tenant architecture)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
