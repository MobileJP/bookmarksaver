const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

function supabaseHeaders() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }

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

    const res = await fetch(`${SUPABASE_URL}/rest/v1/items?id=eq.${id}`, {
      method: 'PATCH',
      headers: supabaseHeaders(),
      body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
    })

    const data = await res.json()
    if (!res.ok) return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify(data) }

    const record = Array.isArray(data) ? data[0] : data
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(record) }
  }

  // DELETE — remove item
  if (event.httpMethod === 'DELETE') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/items?id=eq.${id}`, {
      method: 'DELETE',
      headers: supabaseHeaders(),
    })

    if (!res.ok) {
      const data = await res.json()
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify(data) }
    }

    return { statusCode: 204, headers: corsHeaders(), body: '' }
  }

  return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) }
}
