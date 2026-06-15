import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Redirect unauthenticated users from protected routes
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/reset-password')) {
    // Get role and redirect to appropriate dashboard
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const roleRoutes: Record<string, string> = {
      owner: '/dashboard/owner',
      manager: '/dashboard/manager',
      receptionist: '/dashboard/staff',
      housekeeping: '/dashboard/staff',
      security: '/dashboard/staff',
    }

    const route = roleData?.role ? roleRoutes[roleData.role] : '/dashboard/staff'
    return NextResponse.redirect(new URL(route, request.url))
  }

  // Role-based route protection
  if (user && pathname.startsWith('/dashboard')) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const role = roleData?.role

    // Owner-only routes
    if (pathname.startsWith('/dashboard/owner') && role !== 'owner') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Manager routes (owner + manager)
    if (pathname.startsWith('/dashboard/manager') && !['owner', 'manager'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // User management — owner only
    if (pathname.startsWith('/dashboard/users') && role !== 'owner') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
