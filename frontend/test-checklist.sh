#!/bin/bash

# Frontend MVP Test Script
# This script helps verify all frontend features are working

echo "🧪 Expense Management System - Frontend Test Checklist"
echo "======================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    
    echo -n "Testing $name... "
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "401" ]; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗ (HTTP $response)${NC}"
        return 1
    fi
}

echo "1. Backend Connectivity Tests"
echo "------------------------------"
test_endpoint "Backend Health" "http://localhost:3001/api/countries"
test_endpoint "Auth Endpoint" "http://localhost:3001/api/session"
echo ""

echo "2. Frontend Pages Tests"
echo "----------------------"
test_endpoint "Landing Page" "http://localhost:3000"
test_endpoint "Login Page" "http://localhost:3000/login"
test_endpoint "Signup Page" "http://localhost:3000/signup"
echo ""

echo "3. Manual Testing Checklist"
echo "---------------------------"
echo ""
echo "Authentication Flow:"
echo "  [ ] Can access landing page at http://localhost:3000"
echo "  [ ] Can navigate to signup page"
echo "  [ ] Can create new account with company"
echo "  [ ] First user becomes ADMIN automatically"
echo "  [ ] Can login with created account"
echo "  [ ] Can logout successfully"
echo ""

echo "Dashboard (All Roles):"
echo "  [ ] Dashboard loads correctly"
echo "  [ ] Sidebar navigation visible"
echo "  [ ] User avatar and name displayed"
echo "  [ ] Role badge shown correctly"
echo ""

echo "Employee Features:"
echo "  [ ] Can navigate to 'My Expenses'"
echo "  [ ] Can click 'Submit Expense'"
echo "  [ ] Can select currency (USD, EUR, GBP, INR)"
echo "  [ ] Can select category"
echo "  [ ] Can enter amount and description"
echo "  [ ] Can submit expense successfully"
echo "  [ ] Can view submitted expenses in table"
echo "  [ ] Can see expense status (PENDING/APPROVED/REJECTED)"
echo ""

echo "Admin Features - User Management:"
echo "  [ ] Can navigate to 'Users' page"
echo "  [ ] Can click 'Add User'"
echo "  [ ] Can create Manager user"
echo "  [ ] Can create Employee user"
echo "  [ ] Can assign manager to employee"
echo "  [ ] Can see all users in table"
echo "  [ ] Can delete users"
echo ""

echo "Admin Features - Approval Rules:"
echo "  [ ] Can navigate to 'Approval Rules'"
echo "  [ ] Can click 'Add Rule'"
echo "  [ ] Can select rule type (Sequential/Percentage/Specific/Hybrid)"
echo "  [ ] Can toggle 'Manager approval first'"
echo "  [ ] Can select multiple approvers"
echo "  [ ] Can set approval percentage"
echo "  [ ] Can set specific approver"
echo "  [ ] Can create rule successfully"
echo "  [ ] Can see rules in table"
echo "  [ ] Can toggle rule status (Active/Inactive)"
echo "  [ ] Can delete rules"
echo ""

echo "Manager/Admin Features - Approvals:"
echo "  [ ] Can navigate to 'Approvals'"
echo "  [ ] Can see pending expenses"
echo "  [ ] Can see employee name and details"
echo "  [ ] Amount shown in company currency"
echo "  [ ] Can click 'Approve' button"
echo "  [ ] Can add approval comments"
echo "  [ ] Can approve expense successfully"
echo "  [ ] Can click 'Reject' button"
echo "  [ ] Comments required for rejection"
echo "  [ ] Can reject expense successfully"
echo ""

echo "Multi-Currency:"
echo "  [ ] Can submit expense in EUR"
echo "  [ ] Can submit expense in GBP"
echo "  [ ] Can submit expense in INR"
echo "  [ ] Company currency displayed correctly"
echo "  [ ] Conversion shown when different currency"
echo ""

echo "Sequential Approval Flow:"
echo "  [ ] Expense shows 'Step 1' after submission"
echo "  [ ] Manager sees expense in pending approvals"
echo "  [ ] After manager approves, moves to Step 2"
echo "  [ ] Admin sees expense in pending approvals"
echo "  [ ] After admin approves, status = APPROVED"
echo "  [ ] Employee sees updated status"
echo "  [ ] Approval history visible"
echo ""

echo "UI/UX:"
echo "  [ ] All pages responsive"
echo "  [ ] Navigation smooth"
echo "  [ ] Forms validate correctly"
echo "  [ ] Error messages display properly"
echo "  [ ] Success messages show"
echo "  [ ] Loading states work"
echo "  [ ] No console errors"
echo ""

echo "Security:"
echo "  [ ] Can't access dashboard when logged out"
echo "  [ ] Redirects to login when unauthorized"
echo "  [ ] Employee can't see Users page"
echo "  [ ] Employee can't see Approval Rules page"
echo "  [ ] Manager can see Approvals"
echo "  [ ] Only admin can manage users"
echo "  [ ] Only admin can manage rules"
echo ""

echo ""
echo "4. Browser Console Check"
echo "------------------------"
echo "Open browser DevTools and check:"
echo "  [ ] No JavaScript errors"
echo "  [ ] API calls successful (Network tab)"
echo "  [ ] Cookies set correctly"
echo "  [ ] No CORS errors"
echo ""

echo "5. Quick Test Commands"
echo "----------------------"
echo ""
echo "# Test backend API directly:"
echo "curl http://localhost:3001/api/countries"
echo ""
echo "# Check frontend build:"
echo "cd frontend && npm run build"
echo ""
echo "# View backend logs:"
echo "cd backend && npm run dev"
echo ""

echo ""
echo -e "${YELLOW}🎯 Demo Ready Checklist:${NC}"
echo "=========================="
echo "  [ ] Backend running on port 3001"
echo "  [ ] Frontend running on port 3000"
echo "  [ ] PostgreSQL database running"
echo "  [ ] Can access http://localhost:3000"
echo "  [ ] Can create account and login"
echo "  [ ] Can submit and approve expense"
echo "  [ ] Browser console has no errors"
echo "  [ ] All pages load correctly"
echo ""
echo -e "${GREEN}✅ If all items above are checked, you're ready for the demo!${NC}"
echo ""
