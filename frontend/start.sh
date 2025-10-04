#!/bin/bash

# Expense Management System - Frontend Startup Script
# This script ensures the frontend starts correctly with all prerequisites

set -e

echo "🚀 Starting Expense Management System Frontend..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Creating .env.local file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
    echo "✅ Environment file created"
    echo ""
fi

# Check if backend is running
echo "🔍 Checking backend connection..."
if curl -s http://localhost:3001/api/countries > /dev/null 2>&1; then
    echo "✅ Backend is running on port 3001"
else
    echo "⚠️  Backend is not running!"
    echo "   Please start the backend server first:"
    echo "   cd ../backend && npm run dev"
    echo ""
fi

echo ""
echo "🎨 Starting Next.js development server..."
echo "   Frontend will be available at: http://localhost:3000"
echo ""

npm run dev
