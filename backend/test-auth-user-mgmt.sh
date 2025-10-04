#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001/api"
COOKIES_FILE="test-cookies.txt"

# Counter for tests
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Authentication & User Management Test Suite                  ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Test helper function
run_test() {
    local test_name=$1
    local command=$2
    local expected_status=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}Test $TOTAL_TESTS: $test_name${NC}"
    
    response=$(eval $command)
    status=$?
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "$response"
    fi
    echo ""
}

# Cleanup function
cleanup() {
    rm -f $COOKIES_FILE
}

# Trap to cleanup on exit
trap cleanup EXIT

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Phase 1: Country & Currency APIs (No Auth Required)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 1: Get unique countries
run_test "Get unique countries list" \
    "curl -s -w '\n%{http_code}' $BASE_URL/countries/unique | tail -n 1 | grep -q '200' && curl -s $BASE_URL/countries/unique" \
    200

# Test 2: Get currency for India
run_test "Get currency for India" \
    "curl -s -w '\n%{http_code}' $BASE_URL/countries/India/currency | tail -n 1 | grep -q '200' && curl -s $BASE_URL/countries/India/currency" \
    200

# Test 3: Get exchange rates for USD
run_test "Get exchange rates for USD" \
    "curl -s -w '\n%{http_code}' $BASE_URL/currencies/rates/USD | tail -n 1 | grep -q '200' && curl -s $BASE_URL/currencies/rates/USD" \
    200

# Test 4: Convert currency
run_test "Convert 100 USD to INR" \
    "curl -s -w '\n%{http_code}' -X POST $BASE_URL/currencies/convert -H 'Content-Type: application/json' -d '{\"amount\": 100, \"from\": \"USD\", \"to\": \"INR\"}' | tail -n 1 | grep -q '200' && curl -s -X POST $BASE_URL/currencies/convert -H 'Content-Type: application/json' -d '{\"amount\": 100, \"from\": \"USD\", \"to\": \"INR\"}'" \
    200

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Phase 2: Authentication Flow${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Generate random email to avoid conflicts
RANDOM_SUFFIX=$(date +%s)
ADMIN_EMAIL="admin${RANDOM_SUFFIX}@test.com"
MANAGER_EMAIL="manager${RANDOM_SUFFIX}@test.com"
EMPLOYEE_EMAIL="employee${RANDOM_SUFFIX}@test.com"

# Test 5: Signup (creates company and admin)
echo -e "${YELLOW}Test 5: Signup with India as country${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/auth-custom/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Admin\",
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"Test123!\",
    \"country\": \"India\"
  }")

if echo "$SIGNUP_RESPONSE" | jq -e '.user.email' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED - User created${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "$SIGNUP_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "$SIGNUP_RESPONSE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 6: Signin
echo -e "${YELLOW}Test 6: Sign in with created user${NC}"
SIGNIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -c $COOKIES_FILE \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"Test123!\"
  }")

if echo "$SIGNIN_RESPONSE" | jq -e '.user' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED - Signin successful${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "$SIGNIN_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "$SIGNIN_RESPONSE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 7: Get current user (verify company creation)
echo -e "${YELLOW}Test 7: Get current user details (verify ADMIN role and company)${NC}"
ME_RESPONSE=$(curl -s $BASE_URL/users/me -b $COOKIES_FILE)

if echo "$ME_RESPONSE" | jq -e '.role == "ADMIN" and .company.baseCurrency == "INR" and .company.country == "India"' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED - User is ADMIN with company in India (INR currency)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "$ME_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "$ME_RESPONSE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Phase 3: User Management (Admin Operations)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Test 8: Create Manager
echo -e "${YELLOW}Test 8: Create Manager user${NC}"
MANAGER_RESPONSE=$(curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -b $COOKIES_FILE \
  -d "{
    \"name\": \"Test Manager\",
    \"email\": \"$MANAGER_EMAIL\",
    \"role\": \"MANAGER\"
  }")

if echo "$MANAGER_RESPONSE" | jq -e '.user.role == "MANAGER"' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED - Manager created${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    MANAGER_ID=$(echo "$MANAGER_RESPONSE" | jq -r '.user.id')
    MANAGER_PASSWORD=$(echo "$MANAGER_RESPONSE" | jq -r '.temporaryPassword')
    echo "$MANAGER_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "$MANAGER_RESPONSE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 9: Create Employee with Manager
echo -e "${YELLOW}Test 9: Create Employee with assigned Manager${NC}"
EMPLOYEE_RESPONSE=$(curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -b $COOKIES_FILE \
  -d "{
    \"name\": \"Test Employee\",
    \"email\": \"$EMPLOYEE_EMAIL\",
    \"role\": \"EMPLOYEE\",
    \"managerId\": \"$MANAGER_ID\"
  }")

if echo "$EMPLOYEE_RESPONSE" | jq -e '.user.role == "EMPLOYEE" and .user.manager.id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED - Employee created with manager${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    EMPLOYEE_ID=$(echo "$EMPLOYEE_RESPONSE" | jq -r '.user.id')
    echo "$EMPLOYEE_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "$EMPLOYEE_RESPONSE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 10: Update Employee role to Manager
echo -e "${YELLOW}Test 10: Update Employee role to MANAGER${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT $BASE_URL/users/$EMPLOYEE_ID \
  -H "Content-Type: application/json" \
  -b $COOKIES_FILE \
  -d "{
    \"role\": \"MANAGER\"
  }")

if echo "$UPDATE_RESPONSE" | jq -e '.role == "MANAGER"' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED - Role changed to MANAGER${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "$UPDATE_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "$UPDATE_RESPONSE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 11: Get all users
echo -e "${YELLOW}Test 11: Get all users in company${NC}"
USERS_RESPONSE=$(curl -s $BASE_URL/users -b $COOKIES_FILE)

if echo "$USERS_RESPONSE" | jq -e 'length >= 3' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED - Retrieved all users${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "$USERS_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "$USERS_RESPONSE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 12: Try to create user with invalid role (should fail)
echo -e "${YELLOW}Test 12: Try to create user with invalid role (should fail)${NC}"
INVALID_RESPONSE=$(curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -b $COOKIES_FILE \
  -d "{
    \"name\": \"Invalid User\",
    \"email\": \"invalid${RANDOM_SUFFIX}@test.com\",
    \"role\": \"SUPERADMIN\"
  }")

if echo "$INVALID_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED - Invalid role rejected${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "$INVALID_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ FAILED - Should have rejected invalid role${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "$INVALID_RESPONSE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# Test 13: Try to create circular manager relationship (should fail)
echo -e "${YELLOW}Test 13: Try to create circular manager relationship (should fail)${NC}"
CIRCULAR_RESPONSE=$(curl -s -X PUT $BASE_URL/users/$MANAGER_ID \
  -H "Content-Type: application/json" \
  -b $COOKIES_FILE \
  -d "{
    \"managerId\": \"$EMPLOYEE_ID\"
  }")

if echo "$CIRCULAR_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED - Circular relationship prevented${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo "$CIRCULAR_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ FAILED - Should have prevented circular relationship${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "$CIRCULAR_RESPONSE"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Results Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ All tests passed! Authentication & User Management works!  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ Some tests failed. Please check the implementation.        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
