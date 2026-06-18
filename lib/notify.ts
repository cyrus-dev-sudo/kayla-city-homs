export async function sendNotification({
  title,
  message,
  entity_type,
  entity_id,
  roles = ['owner', 'manager'],
}: {
  title: string
  message: string
  entity_type?: string
  entity_id?: string
  roles?: string[]
}) {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, entity_type, entity_id, roles }),
    })
  } catch {
    // Notifications are non-critical — fail silently
  }
}
