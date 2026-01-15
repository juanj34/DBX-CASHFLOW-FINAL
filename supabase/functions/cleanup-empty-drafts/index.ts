import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting empty drafts cleanup...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    console.log(`Deleting empty drafts older than: ${twentyFourHoursAgo}`)
    
    // Delete empty drafts older than 24 hours
    // Empty = no client_name, no project_name, and no meaningful inputs
    const { data: deletedDrafts, error } = await supabase
      .from('cashflow_quotes')
      .delete()
      .eq('status', 'draft')
      .is('client_name', null)
      .is('project_name', null)
      .lt('created_at', twentyFourHoursAgo)
      .select('id')
    
    if (error) {
      console.error('Error deleting empty drafts:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const deletedCount = deletedDrafts?.length || 0
    console.log(`Successfully deleted ${deletedCount} empty drafts`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_count: deletedCount,
        deleted_ids: deletedDrafts?.map(d => d.id) || []
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (err) {
    console.error('Unexpected error in cleanup:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
