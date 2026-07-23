import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

interface Props {
  tenantId: string;
}

export function CookieConsentBanner({ tenantId }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(`lgpd_consent_${tenantId}`);
    if (!consent) {
      setVisible(true);
    }
  }, [tenantId]);

  const handleConsent = async (aceito: boolean) => {
    const sessionId = crypto.randomUUID();

    try {
      await supabase.from("lgpd_consentimentos" as any).insert({
        tenant_id: tenantId,
        tipo: "cookies",
        aceito,
        session_id: sessionId,
        user_agent: navigator.userAgent,
      });
    } catch {
      // Silently fail - don't block UX
    }

    localStorage.setItem(`lgpd_consent_${tenantId}`, JSON.stringify({ aceito, at: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl shadow-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Sua privacidade importa</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Utilizamos cookies para melhorar sua experiência de navegação e personalizar nossos serviços. 
              Ao aceitar, você concorda com nossa Política de Privacidade e com o uso de cookies conforme a LGPD 
              (Lei Geral de Proteção de Dados).
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={() => handleConsent(true)} className="text-xs">
                Aceitar Cookies
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleConsent(false)} className="text-xs">
                Recusar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
