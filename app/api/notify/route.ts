import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, message, entity_type, entity_id, roles } = await request.json()

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get all users with the specified roles
    const targetRoles = roles || ['owner', 'manager']
    const { data: roleRecords } = await adminSupabase
      .from('user_roles')
      .select('user_id')
      .in('role', targetRoles)

    if (!roleRecords || roleRecords.length === 0) {
      return NextResponse.json({ success: true, notified: 0 })
    }

    // Create notification for each target user (excluding the sender)
    const notifications = roleRecords
      .filter(r => r.user_id !== user.id)
      .map(r => ({
        user_id: r.user_id,
        title,
        message,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        read: false,
      }))

    if (notifications.length === 0) {
      return NextResponse.json({ success: true, notified: 0 })
    }

    const { error } = await adminSupabase.from('notifications').insert(notifications)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Log to activity log
    await adminSupabase.from('activity_log').insert({
      user_id: user.id,
      action: title,
      entity_type: entity_type || null,
      entity_id: entity_id || null,
      metadata: { message },
    })

    return NextResponse.json({ success: true, notified: notifications.length })
  } catch (err) {
    console.error('Notify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
