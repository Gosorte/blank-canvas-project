import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Notificacao {
  id: string;
  tenant_id: string;
  cliente_id: string | null;
  canal: string; // 'whatsapp' | 'email'
  destinatario: string;
  assunto: string | null;
  mensagem: string;
  contexto: string | null;
  referencia_id: string | null;
  status: string;
  chave_idempotente: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const WHATSAPP_API_URL = Deno.env.get("WHATSAPP_API_URL");
  const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN");
  const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "Gráfica 360 <onboarding@resend.dev>";

  try {
    // Aceita filtro opcional por tenant ou limit
    let body: { tenant_id?: string; limit?: number } = {};
    try {
      body = await req.json();
    } catch {
      // sem body, ok
    }
    const limit = Math.min(body.limit ?? 50, 200);

    // Buscar pendentes (com pequenas tentativas)
    let q = supabase
      .from("notificacoes_pendentes")
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (body.tenant_id) q = q.eq("tenant_id", body.tenant_id);

    const { data: pendentes, error: fetchErr } = await q;
    if (fetchErr) throw fetchErr;

    const lista = (pendentes ?? []) as Notificacao[];
    let enviadas = 0;
    let falhas = 0;
    const detalhes: Array<{ id: string; status: string; erro?: string }> = [];

    for (const n of lista) {
      // Lock atômico: marca como "processando" só se ainda estiver "pendente".
      // Se outra execução já pegou, o update retorna 0 linhas e pulamos.
      const { data: locked, error: lockErr } = await supabase
        .from("notificacoes_pendentes")
        .update({ status: "processando" })
        .eq("id", n.id)
        .eq("status", "pendente")
        .select("id")
        .maybeSingle();

      if (lockErr || !locked) {
        detalhes.push({ id: n.id, status: "pulado", erro: "já processada por outra execução" });
        continue;
      }

      // Idempotência adicional: se já existe outra notificação ENVIADA com a mesma chave, marca como duplicada
      if (n.chave_idempotente) {
        const { data: jaEnviada } = await supabase
          .from("notificacoes_pendentes")
          .select("id")
          .eq("tenant_id", n.tenant_id)
          .eq("canal", n.canal)
          .eq("chave_idempotente", n.chave_idempotente)
          .eq("status", "enviado")
          .neq("id", n.id)
          .limit(1)
          .maybeSingle();

        if (jaEnviada) {
          await supabase
            .from("notificacoes_pendentes")
            .update({ status: "duplicada", erro: "Já enviada anteriormente (idempotência)" })
            .eq("id", n.id);
          detalhes.push({ id: n.id, status: "duplicada" });
          continue;
        }
      }

      try {
        if (n.canal === "whatsapp") {
          await enviarWhatsapp(n, WHATSAPP_API_URL, WHATSAPP_API_TOKEN);
        } else if (n.canal === "email") {
          await enviarEmail(n, RESEND_API_KEY, EMAIL_FROM);
        } else {
          throw new Error(`Canal desconhecido: ${n.canal}`);
        }

        await supabase
          .from("notificacoes_pendentes")
          .update({
            status: "enviado",
            enviado_em: new Date().toISOString(),
            erro: null,
          })
          .eq("id", n.id);

        enviadas++;
        detalhes.push({ id: n.id, status: "enviado" });
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        await supabase
          .from("notificacoes_pendentes")
          .update({
            status: "falhou",
            erro: msg.slice(0, 500),
          })
          .eq("id", n.id);

        falhas++;
        detalhes.push({ id: n.id, status: "falhou", erro: msg });
      }
    }

    return new Response(
      JSON.stringify({
        processadas: lista.length,
        enviadas,
        falhas,
        detalhes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── WhatsApp ─────────────────────────────────────────────
async function enviarWhatsapp(
  n: Notificacao,
  apiUrl: string | undefined,
  token: string | undefined
) {
  if (!apiUrl || !token) {
    throw new Error("WHATSAPP_API_URL/TOKEN não configurados");
  }
  const numero = (n.destinatario || "").replace(/\D/g, "");
  if (!numero) throw new Error("Destinatário inválido");

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: numero,
      type: "text",
      text: { body: n.mensagem },
    }),
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${txt.slice(0, 200)}`);
}

// ─── Email (Resend) ────────────────────────────────────────
async function enviarEmail(
  n: Notificacao,
  resendKey: string | undefined,
  from: string
) {
  if (!resendKey) throw new Error("RESEND_API_KEY não configurada");
  if (!n.destinatario) throw new Error("Email destinatário ausente");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from,
      to: [n.destinatario],
      subject: n.assunto ?? "Atualização do seu pedido",
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a">
        <p>${escapeHtml(n.mensagem)}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="font-size:12px;color:#64748b">Mensagem automática — Gráfica 360°</p>
      </div>`,
    }),
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(`Resend ${res.status}: ${txt.slice(0, 200)}`);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
