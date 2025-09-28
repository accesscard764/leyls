import { createClient } from "npm:@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateAgentRequest {
  name: string;
  email: string;
  password: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { name, email, password }: CreateAgentRequest = await req.json();

    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required');
    }

    console.log('👤 Creating support agent via Supabase Auth:', email);

    // Create user in Supabase Auth with support role
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        role: 'support'
      },
      app_metadata: {
        role: 'support'
      },
      email_confirm: true // Auto-confirm email for support agents
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log('✅ Auth user created:', authUser.user.id);

    // Insert into users table with support role
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        role: 'support',
        user_metadata: {
          name,
          role: 'support'
        }
      });

    if (usersError && usersError.code !== '23505') { // Ignore duplicate key errors
      console.error('❌ Error inserting into users table:', usersError);
      throw new Error(`Failed to create user record: ${usersError.message}`);
    }

    // Insert into support_agents table for backward compatibility
    const { error: agentsError } = await supabaseAdmin
      .from('support_agents')
      .insert({
        id: authUser.user.id,
        name,
        email,
        role: 'support_agent',
        is_active: true
      });

    if (agentsError && agentsError.code !== '23505') { // Ignore duplicate key errors
      console.error('❌ Error inserting into support_agents table:', agentsError);
      // Don't throw here as the main auth user was created successfully
    }

    console.log('✅ Support agent created successfully via Supabase Auth');

    return new Response(
      JSON.stringify({
        id: authUser.user.id,
        name,
        email,
        role: 'support',
        is_active: true,
        created_at: authUser.user.created_at
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error creating support agent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});