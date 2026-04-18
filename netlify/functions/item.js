const { createClient } = require('@supabase/supabase-js')

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }

  const supabase = getSupabase()
  const id = event.path.split('/').pop()

  if (!id) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Item ID required' }) }
  }

  // PUT — update item
  if (event.httpMethod === 'PUT') {
    let body
    try {
      body = JSON.parse(event.body)
    } catch {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) }
    }

    const { data, error } = await supabase
      .from('items')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: error.message }) }
    }

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(data) }
  }

  // DELETE — remove item
  if (event.httpMethod === 'DELETE') {
    const { error } = await supabase.from('items').delete().eq('id', id)

    if (error) {
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: error.message }) }
    }

    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }

  return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) }
}
