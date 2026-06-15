import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const routes: Record<string, string> = {
    owner: '/dashboard/owner',
    manager: '/dashboard/manager',
    receptionist: '/dashboard/staff',
    housekeeping: '/dashboard/staff',
    security: '/dashboard/staff',
  }

  redirect(roleData?.role ? routes[roleData.role] : '/dashboard/staff')
}
