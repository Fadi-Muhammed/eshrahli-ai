export const config = {
  runtime: 'nodejs',
}

export default async function handler() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
