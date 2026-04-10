#!/bin/bash

# Social Authentication Test Script
# Tests all public endpoints without requiring OAuth credentials

echo "======================================"
echo "Social Authentication API Tests"
echo "======================================"
echo ""

BASE_URL="http://localhost:3001"
echo "Testing against: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5

  echo -n "Testing: $name... "

  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
    PASSED=$((PASSED + 1))
    if [ ! -z "$body" ] && [ "$body" != "null" ]; then
      echo "   Response: $(echo $body | jq -c '.' 2>/dev/null || echo $body | head -c 100)"
    fi
  else
    echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
    FAILED=$((FAILED + 1))
    echo "   Response: $body"
  fi
  echo ""
}

echo "======================================"
echo "1. Testing Public Endpoints"
echo "======================================"
echo ""

# Test 1: Get available providers
test_endpoint \
  "GET /auth/social/providers" \
  "GET" \
  "/auth/social/providers" \
  "" \
  "200"

# Test 2: Initialize Google OAuth
test_endpoint \
  "POST /auth/social/google/init" \
  "POST" \
  "/auth/social/google/init" \
  '{}' \
  "200"

# Test 3: Initialize GitHub OAuth
test_endpoint \
  "POST /auth/social/github/init" \
  "POST" \
  "/auth/social/github/init" \
  '{}' \
  "200"

# Test 4: Invalid provider should fail
test_endpoint \
  "POST /auth/social/invalid/init (should fail)" \
  "POST" \
  "/auth/social/invalid/init" \
  '{}' \
  "400"

echo "======================================"
echo "2. Testing Protected Endpoints (should fail without auth)"
echo "======================================"
echo ""

# Test 5: Get linked accounts without auth (should fail)
test_endpoint \
  "GET /auth/social/linked (no auth - should fail)" \
  "GET" \
  "/auth/social/linked" \
  "" \
  "401"

# Test 6: Link account without auth (should fail)
test_endpoint \
  "POST /auth/social/link (no auth - should fail)" \
  "POST" \
  "/auth/social/link" \
  '{"provider":"google","accessToken":"test"}' \
  "401"

# Test 7: Unlink account without auth (should fail)
test_endpoint \
  "POST /auth/social/unlink (no auth - should fail)" \
  "POST" \
  "/auth/social/unlink" \
  '{"provider":"google"}' \
  "401"

echo "======================================"
echo "3. Testing Validation"
echo "======================================"
echo ""

# Test 8: Missing required fields
test_endpoint \
  "POST /auth/social/google/callback (missing fields)" \
  "POST" \
  "/auth/social/google/callback" \
  '{}' \
  "400"

# Test 9: Invalid state token
test_endpoint \
  "POST /auth/social/google/callback (invalid state)" \
  "POST" \
  "/auth/social/google/callback" \
  '{"code":"test","state":"invalid"}' \
  "400"

echo "======================================"
echo "Test Results Summary"
echo "======================================"
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed! ✓${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Configure OAuth credentials in .env"
  echo "2. Test full OAuth flow with real credentials"
  echo "3. Test account linking with authenticated user"
  exit 0
else
  echo -e "${RED}Some tests failed. Please check the implementation.${NC}"
  exit 1
fi
