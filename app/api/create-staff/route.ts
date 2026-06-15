import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is an owner
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleData?.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can create staff accounts' }, { status: 403 })
    }

    const { full_name, email, phone, password, role } = await request.json()

    if (!full_name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service role key for admin operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create the auth user
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    const newUserId = newUser.user.id

    // Update phone if provided (profile created by trigger)
    if (phone) {
      await adminSupabase
        .from('profiles')
        .update({ phone })
        .eq('id', newUserId)
    }

    // Assign role
    const { error: roleError } = await adminSupabase
      .from('user_roles')
      .insert({ user_id: newUserId, role, assigned_by: user.id })

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 400 })
    }

    return NextResponse.json({ id: newUserId, success: true })
  } catch (err) {
    console.error('Create staff error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
