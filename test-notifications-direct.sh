#!/bin/bash

echo "=== Testing Direct Notification Sending ==="
echo ""

# Test 1: Send to user
echo "1. Testing user notification (ID: 979543346)..."
curl -s "https://willow-coffee-order.onrender.com/api/test-notifications/direct/979543346" | python3 -m json.tool
echo ""
echo ""

# Test 2: Send to group
echo "2. Testing group notification..."
curl -s "https://willow-coffee-order.onrender.com/api/test-notifications/group" | python3 -m json.tool
echo ""
echo ""

# Test 3: Send order notification
echo "3. Testing order notification..."
curl -s -X POST "https://willow-coffee-order.onrender.com/api/test-notifications/order" \
  -H "Content-Type: application/json" \
  -d '{"chatId": "979543346"}' | python3 -m json.tool
echo ""

echo "=== Check your Telegram for messages! ==="
