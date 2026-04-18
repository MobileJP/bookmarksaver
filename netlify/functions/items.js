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

  // GET — list/search items
  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {}
    const { search, tags, category, limit = '50', offset = '0' } = params

    let query = supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (search && search.trim()) {
      const s = search.trim()
      query = query.or(
        `title.ilike.%${s}%,description.ilike.%${s}%,url.ilike.%${s}%,notes.ilike.%${s}%`
      )
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (tagList.length) query = query.overlaps('tags', tagList)
    }

    const { data, error } = await query

    if (error) {
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: error.message }) }
    }

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

    const { data, error } = await supabase
      .from('items')
      .insert([{ url, title, description, image_url, tags: tags || [], category: category || 'general', source: source || 'web', notes, favicon_url }])
      .select()
      .single()

    if (error) {
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: error.message }) }
    }

    return { statusCode: 201, headers: corsHeaders(), body: JSON.stringify(data) }
  }

  return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) }
}
