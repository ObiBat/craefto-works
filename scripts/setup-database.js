const { createClient } = require('@supabase/supabase-js');

// Credentials come from the environment, never from this file:
//   node --env-file=.env.local scripts/setup-database.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupDatabase() {
  console.log('Setting up database via Supabase RPC...\n');

  // First, let's check if we can use RPC to execute SQL
  // If not, we'll create tables through the REST API by inserting data

  // Try to insert default pipeline stages
  console.log('Creating pipeline stages...');
  const stages = [
    { name: 'New', slug: 'new', order: 1, color: '#6B7280' },
    { name: 'Contacted', slug: 'contacted', order: 2, color: '#3B82F6' },
    { name: 'Qualified', slug: 'qualified', order: 3, color: '#8B5CF6' },
    { name: 'Proposal Sent', slug: 'proposal', order: 4, color: '#F59E0B' },
    { name: 'Negotiation', slug: 'negotiation', order: 5, color: '#EC4899' },
    { name: 'Won', slug: 'won', order: 6, color: '#10B981' },
    { name: 'Lost', slug: 'lost', order: 7, color: '#EF4444' }
  ];

  const { error: stagesError } = await supabase
    .from('pipeline_stages')
    .upsert(stages, { onConflict: 'slug' });

  if (stagesError) {
    if (stagesError.code === 'PGRST205') {
      console.log('Tables do not exist yet. Please run the SQL migration manually:');
      console.log('\n1. Go to: https://supabase.com/dashboard/project/vugaieeadequzuplvcqp/sql');
      console.log('2. Copy and paste the contents of: supabase/migrations/001_initial_schema.sql');
      console.log('3. Click "Run"\n');
      return;
    }
    console.error('Error:', stagesError.message);
  } else {
    console.log('Pipeline stages created successfully!');
  }

  // Test by checking if leads table exists
  const { error } = await supabase.from('leads').select('count').limit(1);

  if (error && error.code === 'PGRST205') {
    console.log('\n⚠️  Tables not found. Please run the SQL migration in Supabase dashboard.');
  } else {
    console.log('\n✅ Database setup complete!');
  }
}

setupDatabase();
