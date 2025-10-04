#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   Expense Management System - Auth Testing${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")
echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
echo ""

# Test 2: Sign Up (Custom Endpoint)
echo -e "${YELLOW}2. Testing Sign Up (Custom Endpoint)...${NC}"
SIGNUP_EMAIL="test$(date +%s)@example.com"
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth-custom/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"$SIGNUP_EMAIL\",
    \"password\": \"Pass123!\",
    \"country\": \"United States\"
  }")
echo "$SIGNUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNUP_RESPONSE"
echo ""

# Test 3: Sign Up (Better Auth Endpoint)
echo -e "${YELLOW}3. Testing Sign Up (Better Auth Endpoint)...${NC}"
BETTER_EMAIL="better$(date +%s)@example.com"
BETTER_SIGNUP=$(curl -s -X POST "$BASE_URL/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Better User\",
    \"email\": \"$BETTER_EMAIL\",
    \"password\": \"Pass123!\"
  }")
echo "$BETTER_SIGNUP" | jq '.' 2>/dev/null || echo "$BETTER_SIGNUP"
echo ""

# Test 4: Sign In
echo -e "${YELLOW}4. Testing Sign In...${NC}"
echo "Using email: $SIGNUP_EMAIL"
SIGNIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/sign-in/email" \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt \
  -d "{
    \"email\": \"$SIGNUP_EMAIL\",
    \"password\": \"Pass123!\"
  }")
echo "$SIGNIN_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNIN_RESPONSE"
echo ""

# Test 5: Get Session
echo -e "${YELLOW}5. Testing Get Session (after login)...${NC}"
SESSION_RESPONSE=$(curl -s "$BASE_URL/api/session" -b /tmp/cookies.txt)
echo "$SESSION_RESPONSE" | jq '.' 2>/dev/null || echo "$SESSION_RESPONSE"
echo ""

# Test 6: Get Current User (Protected Endpoint)
echo -e "${YELLOW}6. Testing Protected Endpoint (/api/users/me)...${NC}"
ME_RESPONSE=$(curl -s "$BASE_URL/api/users/me" -b /tmp/cookies.txt)
echo "$ME_RESPONSE" | jq '.' 2>/dev/null || echo "$ME_RESPONSE"
echo ""

# Cleanup
rm -f /tmp/cookies.txt

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}Testing Complete!${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""
echo -e "${YELLOW}Note: According to the documentation, there's a known issue:${NC}"
echo -e "${YELLOW}Signup completes but signin may fail with 'Invalid email or password'${NC}"
echo -e "${YELLOW}Check the backend terminal for any error messages.${NC}"
