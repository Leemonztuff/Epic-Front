#!/bin/bash
# Epic RPG Database Setup Script
# Usage: bash scripts/setup-db.sh

set -e

echo "🚀 Epic RPG Database Setup"
echo ""

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

# Check environment
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not set"
    exit 1
fi

echo "📡 Target: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Extract project ref from URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\///' | sed 's/\..*//')

echo "🔧 Project: $PROJECT_REF"
echo ""

# Check if linked
if [ -d ".supabase" ]; then
    echo "✅ Project already linked"
else
    echo "🔗 Linking to Supabase project..."
    supabase link --project-ref $PROJECT_REF
fi

echo ""
echo "📊 Executing SQL migrations..."
echo ""

# Run migrations in order
echo "→ 01-schema.sql (tables, RLS, policies)..."
supabase db push --db-url "$NEXT_PUBLIC_SUPABASE_URL" --file supabase/01-schema.sql

echo "→ 02-functions.sql (RPCs)..."
supabase db push --db-url "$NEXT_PUBLIC_SUPABASE_URL" --file supabase/02-functions.sql

echo "→ 04-seed.sql (initial data)..."
supabase db push --db-url "$NEXT_PUBLIC_SUPABASE_URL" --file supabase/04-seed.sql

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Verify tables: SELECT * FROM players LIMIT 1;"
echo "   2. Check functions: SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;"
echo "   3. Run the app and test onboarding"