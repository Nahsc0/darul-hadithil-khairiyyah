const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function failure(status: number) {
  return new Response(JSON.stringify({ ok: false }), { status, headers });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers });
  if (request.method !== "POST") return failure(405);

  const url = Deno.env.get("INTAKE_SCRIPT_URL");
  const secret = Deno.env.get("INTAKE_SECRET");
  if (!url || !secret) return failure(503);

  try {
    const raw = await request.text();
    if (raw.length > 8000) return failure(413);
    const input = JSON.parse(raw);
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, secret }),
      signal: AbortSignal.timeout(25000),
    });
    if (!upstream.ok) return failure(502);
    const receipt = await upstream.json();
    if (receipt.ok !== true) return failure(422);
    return new Response(JSON.stringify({ ok: true, studentId: receipt.studentId }), { headers });
  } catch {
    return failure(502);
  }
});
