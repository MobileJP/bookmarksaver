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

  // GET — list/search items
  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {}
    const { search, tags, category, limit = '50', offset = '0' } = params

    const queryParams = new URLSearchParams()
    queryParams.set('order', 'created_at.desc')
    queryParams.set('limit', limit)
    queryParams.set('offset', offset)

    if (category && category !== 'all') {
      queryParams.set('category', `eq.${category}`)
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (tagList.length) {
        queryParams.set('tags', `cs.{${tagList.join(',')}}`)
      }
    }

    if (search && search.trim()) {
      const s = search.trim()
      queryParams.set('or', `(title.ilike.*${s}*,description.ilike.*${s}*,url.ilike.*${s}*,notes.ilike.*${s}*)`)
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/items?${queryParams}`, {
      headers: supabaseHeaders(),
    })

    const data = await res.json()
    if (!res.ok) return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify(data) }

    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(data) }
  }

  // POST — create item
  if (event.httpMethod === 'POST') {
    let body
    try {
      body = JSON.parse(event.body)
    } catch {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) }
    }

    const { url, title, description, image_url, tags, category, source, notes, favicon_url } = body

    if (!url) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'URL is required' }) }
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/items`, {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify({
        url,
        title: title || '',
        description: description || '',
        image_url: image_url || '',
        favicon_url: favicon_url || '',
        tags: tags || [],
        category: category || 'general',
        source: source || 'web',
        notes: notes || '',
      }),
    })

    const data = await res.json()
    if (!res.ok) return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify(data) }

    const record = Array.isArray(data) ? data[0] : data
    return { statusCode: 201, headers: corsHeaders(), body: JSON.stringify(record) }
  }

  return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) }
}
