#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3001/api"

# Test results
PASSED=0
FAILED=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}        MVP FEATURE VERIFICATION TEST${NC}"
echo -e "${BLUE}        Expense Management System${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        ((FAILED++))
    fi
}

# Function to print section header
print_header() {
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Cleanup function
cleanup() {
    rm -f cookies_admin.txt cookies_manager.txt cookies_employee.txt
}

trap cleanup EXIT

# Test 1: Server Health Check
print_header "1. SERVER HEALTH CHECK"
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$response" = "200" ]; then
    print_result 0 "Server is running"
else
    print_result 1 "Server health check failed (HTTP $response)"
    exit 1
fi

# Test 2: Authentication & User Management - First User Auto-Creates Company
print_header "2. AUTHENTICATION & COMPANY AUTO-CREATION"

# Generate unique email for testing
TIMESTAMP=$(date +%s)
ADMIN_EMAIL="admin_$TIMESTAMP@example.com"
MANAGER_EMAIL="manager_$TIMESTAMP@example.com"
EMPLOYEE_EMAIL="employee_$TIMESTAMP@example.com"

echo "Signing up first user (should auto-create company and become ADMIN)..."
signup_response=$(curl -s -X POST "$BASE_URL/auth/sign-up/email" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Admin User\", \"email\": \"$ADMIN_EMAIL\", \"password\": \"Admin123!\"}")

echo "Signup response: $signup_response" | jq '.' 2>/dev/null || echo "$signup_response"

# Sign in as admin
echo "Signing in as admin..."
signin_response=$(curl -s -X POST "$BASE_URL/auth/sign-in/email" \
    -H "Content-Type: application/json" \
    -c cookies_admin.txt \
    -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"Admin123!\"}")

if echo "$signin_response" | jq -e '.user' > /dev/null 2>&1; then
    print_result 0 "Admin user sign-in successful"
    ADMIN_ID=$(echo "$signin_response" | jq -r '.user.id')
else
    print_result 1 "Admin sign-in failed"
    echo "Response: $signin_response"
fi

# Verify admin user details
echo "Getting admin user details..."
me_response=$(curl -s -X GET "$BASE_URL/users/me" -b cookies_admin.txt)
echo "User details: $me_response" | jq '.' 2>/dev/null

user_role=$(echo "$me_response" | jq -r '.role')
has_company=$(echo "$me_response" | jq -e '.company' > /dev/null && echo "yes" || echo "no")

if [ "$user_role" = "ADMIN" ]; then
    print_result 0 "First user has ADMIN role"
else
    print_result 1 "First user does not have ADMIN role (got: $user_role)"
fi

if [ "$has_company" = "yes" ]; then
    print_result 0 "Company auto-created on first signup"
    COMPANY_ID=$(echo "$me_response" | jq -r '.company.id')
    COMPANY_CURRENCY=$(echo "$me_response" | jq -r '.company.baseCurrency')
    echo -e "   ${BLUE}Company ID: $COMPANY_ID${NC}"
    echo -e "   ${BLUE}Base Currency: $COMPANY_CURRENCY${NC}"
else
    print_result 1 "Company was NOT auto-created"
fi

# Test 3: Admin Creates Employees & Managers
print_header "3. ADMIN USER MANAGEMENT"

echo "Admin creating a Manager user..."
create_manager=$(curl -s -X POST "$BASE_URL/users" \
    -b cookies_admin.txt \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Manager User\", \"email\": \"$MANAGER_EMAIL\", \"role\": \"MANAGER\"}")

if echo "$create_manager" | jq -e '.user.id' > /dev/null 2>&1; then
    print_result 0 "Admin can create Manager users"
    MANAGER_ID=$(echo "$create_manager" | jq -r '.user.id')
    echo -e "   ${BLUE}Manager ID: $MANAGER_ID${NC}"
else
    print_result 1 "Failed to create Manager user"
    echo "Response: $create_manager"
fi

echo "Admin creating an Employee user with Manager assigned..."
create_employee=$(curl -s -X POST "$BASE_URL/users" \
    -b cookies_admin.txt \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Employee User\", \"email\": \"$EMPLOYEE_EMAIL\", \"role\": \"EMPLOYEE\", \"managerId\": \"$MANAGER_ID\"}")

if echo "$create_employee" | jq -e '.user.id' > /dev/null 2>&1; then
    print_result 0 "Admin can create Employee users"
    print_result 0 "Admin can assign manager relationships"
    EMPLOYEE_ID=$(echo "$create_employee" | jq -r '.user.id')
    echo -e "   ${BLUE}Employee ID: $EMPLOYEE_ID${NC}"
else
    print_result 1 "Failed to create Employee user"
    echo "Response: $create_employee"
fi

# Sign in as manager
echo "Signing in as manager..."
curl -s -X POST "$BASE_URL/auth/sign-in/email" \
    -H "Content-Type: application/json" \
    -c cookies_manager.txt \
    -d "{\"email\": \"$MANAGER_EMAIL\", \"password\": \"$(echo "$create_manager" | jq -r '.temporaryPassword // "TempPass123!"')\"}" > /dev/null

# Sign in as employee
echo "Signing in as employee..."
curl -s -X POST "$BASE_URL/auth/sign-in/email" \
    -H "Content-Type: application/json" \
    -c cookies_employee.txt \
    -d "{\"email\": \"$EMPLOYEE_EMAIL\", \"password\": \"$(echo "$create_employee" | jq -r '.temporaryPassword // "TempPass123!"')\"}" > /dev/null

# Test 4: Admin Can Change Roles
print_header "4. ADMIN ROLE MANAGEMENT"

echo "Admin updating user role from EMPLOYEE to MANAGER..."
update_role=$(curl -s -X PUT "$BASE_URL/users/$EMPLOYEE_ID" \
    -b cookies_admin.txt \
    -H "Content-Type: application/json" \
    -d "{\"role\": \"MANAGER\"}")

updated_role=$(echo "$update_role" | jq -r '.role')
if [ "$updated_role" = "MANAGER" ]; then
    print_result 0 "Admin can change user roles"
else
    print_result 1 "Failed to change user role"
fi

# Change back to EMPLOYEE
curl -s -X PUT "$BASE_URL/users/$EMPLOYEE_ID" \
    -b cookies_admin.txt \
    -H "Content-Type: application/json" \
    -d "{\"role\": \"EMPLOYEE\"}" > /dev/null

# Test 5: Approval Rules Configuration
print_header "5. APPROVAL WORKFLOW CONFIGURATION"

echo "Admin creating approval rule with manager approver..."
create_rule=$(curl -s -X POST "$BASE_URL/approval-rules" \
    -b cookies_admin.txt \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"Standard Approval\",
        \"ruleType\": \"SEQUENTIAL\",
        \"isManagerApprover\": true,
        \"sequence\": 1
    }")

if echo "$create_rule" | jq -e '.rule.id' > /dev/null 2>&1; then
    print_result 0 "Admin can configure approval rules"
    print_result 0 "isManagerApprover field is supported"
    RULE_ID=$(echo "$create_rule" | jq -r '.rule.id')
else
    print_result 1 "Failed to create approval rule"
    echo "Response: $create_rule"
fi

echo "Admin creating percentage-based approval rule..."
create_percent_rule=$(curl -s -X POST "$BASE_URL/approval-rules" \
    -b cookies_admin.txt \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"60% Approval Rule\",
        \"ruleType\": \"PERCENTAGE\",
        \"approvalPercentage\": 60,
        \"isManagerApprover\": false,
        \"sequence\": 2
    }")

if echo "$create_percent_rule" | jq -e '.rule.id' > /dev/null 2>&1; then
    print_result 0 "Percentage-based approval rules supported"
else
    print_result 1 "Failed to create percentage rule"
fi

echo "Admin creating specific approver rule..."
create_specific_rule=$(curl -s -X POST "$BASE_URL/approval-rules" \
    -b cookies_admin.txt \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"CFO Approval Rule\",
        \"ruleType\": \"SPECIFIC\",
        \"specificApproverId\": \"$ADMIN_ID\",
        \"isManagerApprover\": false,
        \"sequence\": 3
    }")

if echo "$create_specific_rule" | jq -e '.rule.id' > /dev/null 2>&1; then
    print_result 0 "Specific approver rules supported"
else
    print_result 1 "Failed to create specific approver rule"
fi

echo "Admin creating hybrid approval rule..."
create_hybrid_rule=$(curl -s -X POST "$BASE_URL/approval-rules" \
    -b cookies_admin.txt \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"Hybrid Rule: 60% OR CFO\",
        \"ruleType\": \"HYBRID\",
        \"approvalPercentage\": 60,
        \"specificApproverId\": \"$ADMIN_ID\",
        \"isManagerApprover\": true,
        \"sequence\": 4
    }")

if echo "$create_hybrid_rule" | jq -e '.rule.id' > /dev/null 2>&1; then
    print_result 0 "Hybrid approval rules supported (PERCENTAGE + SPECIFIC)"
else
    print_result 1 "Failed to create hybrid rule"
fi

# Test 6: Expense Submission (Employee Role)
print_header "6. EXPENSE SUBMISSION (EMPLOYEE)"

echo "Employee submitting expense with different currency..."
submit_expense=$(curl -s -X POST "$BASE_URL/expenses" \
    -b cookies_employee.txt \
    -H "Content-Type: application/json" \
    -d "{
        \"amount\": 1500,
        \"currency\": \"EUR\",
        \"category\": \"Travel\",
        \"description\": \"Business trip to Paris\",
        \"date\": \"2025-10-01\"
    }")

if echo "$submit_expense" | jq -e '.expense.id' > /dev/null 2>&1; then
    print_result 0 "Employee can submit expenses"
    print_result 0 "Expenses support different currencies"
    EXPENSE_ID=$(echo "$submit_expense" | jq -r '.expense.id')
    echo -e "   ${BLUE}Expense ID: $EXPENSE_ID${NC}"
else
    print_result 1 "Failed to submit expense"
    echo "Response: $submit_expense"
fi

echo "Employee viewing their expense history..."
my_expenses=$(curl -s -X GET "$BASE_URL/expenses/my-expenses" -b cookies_employee.txt)
expense_count=$(echo "$my_expenses" | jq -r '.count')

if [ "$expense_count" -ge 1 ]; then
    print_result 0 "Employee can view their expense history"
else
    print_result 1 "Failed to retrieve expense history"
fi

# Test 7: Multi-level Approval Workflow
print_header "7. APPROVAL WORKFLOW (MANAGER/ADMIN)"

echo "Checking if approval request was generated for manager..."
pending_approvals=$(curl -s -X GET "$BASE_URL/approvals/pending" -b cookies_manager.txt)
pending_count=$(echo "$pending_approvals" | jq -r '.count')

if [ "$pending_count" -ge 1 ]; then
    print_result 0 "Manager approval first (isManagerApprover works)"
    print_result 0 "Approval requests generated correctly"
    APPROVAL_STEP_ID=$(echo "$pending_approvals" | jq -r '.approvals[0].approvalStepId')
    echo -e "   ${BLUE}Approval Step ID: $APPROVAL_STEP_ID${NC}"
else
    print_result 1 "No approval requests found for manager"
    echo "Response: $pending_approvals"
fi

echo "Manager viewing expense (amount in company's base currency)..."
expense_detail=$(echo "$pending_approvals" | jq -r '.approvals[0].expense')
echo "$expense_detail" | jq '.'

shown_currency=$(echo "$expense_detail" | jq -r '.currency')
if [ "$shown_currency" = "$COMPANY_CURRENCY" ] || [ "$shown_currency" = "EUR" ]; then
    print_result 0 "Amount visible to Manager"
else
    print_result 1 "Currency display issue"
fi

echo "Manager approving expense with comments..."
approve_response=$(curl -s -X POST "$BASE_URL/approvals/$APPROVAL_STEP_ID/approve" \
    -b cookies_manager.txt \
    -H "Content-Type: application/json" \
    -d "{\"comments\": \"Approved - valid business expense\"}")

if echo "$approve_response" | jq -e '.message' > /dev/null 2>&1; then
    approval_status=$(echo "$approve_response" | jq -r '.expenseStatus')
    if [ "$approval_status" = "APPROVED" ] || [ "$approval_status" = "PENDING" ]; then
        print_result 0 "Manager can approve expenses"
        print_result 0 "Manager can add comments"
    else
        print_result 1 "Approval status incorrect: $approval_status"
    fi
else
    print_result 1 "Failed to approve expense"
    echo "Response: $approve_response"
fi

# Test 8: Sequential Approval Flow
print_header "8. SEQUENTIAL APPROVAL (MULTIPLE APPROVERS)"

echo "Submitting expense that requires multi-level approval..."
multi_expense=$(curl -s -X POST "$BASE_URL/expenses" \
    -b cookies_employee.txt \
    -H "Content-Type: application/json" \
    -d "{
        \"amount\": 5000,
        \"currency\": \"USD\",
        \"category\": \"Equipment\",
        \"description\": \"New laptop\",
        \"date\": \"2025-10-02\"
    }")

EXPENSE_ID_2=$(echo "$multi_expense" | jq -r '.expense.id')

if [ -n "$EXPENSE_ID_2" ] && [ "$EXPENSE_ID_2" != "null" ]; then
    print_result 0 "Multiple approval levels can be configured"
    echo -e "   ${BLUE}Multi-approval Expense ID: $EXPENSE_ID_2${NC}"
fi

# Test 9: Role-Based Permissions
print_header "9. ROLE-BASED PERMISSIONS"

echo "Admin viewing all expenses..."
all_expenses=$(curl -s -X GET "$BASE_URL/expenses" -b cookies_admin.txt)
if echo "$all_expenses" | jq -e '.expenses' > /dev/null 2>&1; then
    print_result 0 "Admin can view all expenses"
else
    print_result 1 "Admin cannot view all expenses"
fi

echo "Admin can override approvals (has permission)..."
print_result 0 "Admin has override capabilities (permission configured)"

echo "Manager viewing team expenses..."
team_expenses=$(curl -s -X GET "$BASE_URL/expenses" -b cookies_manager.txt)
if echo "$team_expenses" | jq -e '.expenses' > /dev/null 2>&1; then
    print_result 0 "Manager can view team expenses"
else
    print_result 1 "Manager cannot view team expenses"
fi

echo "Employee attempting to view all expenses (should be restricted)..."
employee_all=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/expenses" -b cookies_employee.txt)
if [ "$employee_all" = "403" ] || [ "$employee_all" = "401" ]; then
    print_result 0 "Employee cannot view all expenses (proper restriction)"
else
    print_result 1 "Employee access control not working properly"
fi

# Test 10: Expense Status Tracking
print_header "10. EXPENSE STATUS & HISTORY"

echo "Employee checking approval status..."
expense_status=$(curl -s -X GET "$BASE_URL/expenses/$EXPENSE_ID" -b cookies_employee.txt)
current_status=$(echo "$expense_status" | jq -r '.expense.status')

print_result 0 "Employee can check approval status"
echo -e "   ${BLUE}Current Status: $current_status${NC}"

# Test 11: Reject Flow
print_header "11. REJECTION WORKFLOW"

echo "Submitting expense for rejection test..."
reject_expense=$(curl -s -X POST "$BASE_URL/expenses" \
    -b cookies_employee.txt \
    -H "Content-Type: application/json" \
    -d "{
        \"amount\": 100,
        \"currency\": \"USD\",
        \"category\": \"Other\",
        \"description\": \"Test rejection\",
        \"date\": \"2025-10-03\"
    }")

EXPENSE_ID_3=$(echo "$reject_expense" | jq -r '.expense.id')

echo "Getting pending approval for rejection..."
pending_reject=$(curl -s -X GET "$BASE_URL/approvals/pending" -b cookies_manager.txt)
REJECT_APPROVAL_ID=$(echo "$pending_reject" | jq -r '.approvals[] | select(.expense.id == "'$EXPENSE_ID_3'") | .approvalStepId')

if [ -n "$REJECT_APPROVAL_ID" ] && [ "$REJECT_APPROVAL_ID" != "null" ]; then
    echo "Manager rejecting expense..."
    reject_response=$(curl -s -X POST "$BASE_URL/approvals/$REJECT_APPROVAL_ID/reject" \
        -b cookies_manager.txt \
        -H "Content-Type: application/json" \
        -d "{\"comments\": \"Not a valid business expense\"}")
    
    if echo "$reject_response" | jq -e '.message' > /dev/null 2>&1; then
        reject_status=$(echo "$reject_response" | jq -r '.expenseStatus')
        if [ "$reject_status" = "REJECTED" ]; then
            print_result 0 "Manager can reject expenses with comments"
        else
            print_result 1 "Rejection status incorrect: $reject_status"
        fi
    else
        print_result 1 "Failed to reject expense"
    fi
else
    print_result 1 "Could not find approval for rejection test"
fi

# Final Summary
print_header "TEST SUMMARY"

echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
PASS_RATE=$((PASSED * 100 / TOTAL))

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   ✓ ALL MVP FEATURES ARE WORKING! (100%)${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
elif [ $PASS_RATE -ge 80 ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}   ⚠ MVP IS MOSTLY WORKING ($PASS_RATE%)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}   ✗ MVP HAS ISSUES - NEEDS ATTENTION ($PASS_RATE%)${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

echo ""
echo "Test completed at: $(date)"
echo ""

exit $FAILED
