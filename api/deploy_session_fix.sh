#!/bin/bash

# Deployment script for session persistence fix
# Run this from the backend/api directory

set -e  # Exit on error

echo "🚀 Deploying Session Persistence Fix..."
echo ""

# Step 1: Run migrations
echo "📦 Step 1: Running database migrations..."
python manage.py migrate users
echo "✅ Migrations complete!"
echo ""

# Step 2: Check if sessions table exists
echo "🔍 Step 2: Verifying sessions table..."
python manage.py dbshell <<EOF
\dt sessions
EOF
echo "✅ Sessions table verified!"
echo ""

# Step 3: Show current sessions (should be empty on first deploy)
echo "📊 Step 3: Current sessions in database..."
python -c "
from users.models import Session
count = Session.objects.count()
print(f'Total sessions: {count}')
if count > 0:
    print('Recent sessions:')
    for s in Session.objects.all()[:5]:
        print(f'  - Token: {s.token[:20]}... (expires: {s.expires_at})')
"
echo ""

echo "✨ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Test login: POST /api/auth/login"
echo "  2. Test storage: POST /api/storage (should return 201)"
echo "  3. Verify token persists after server restart"
echo ""
echo "💡 Tips:"
echo "  - Tokens now last 24 hours"
echo "  - HTTP 201 is the CORRECT success code for storage"
echo "  - Check logs at: https://dashboard.render.com/web/neuralport"
