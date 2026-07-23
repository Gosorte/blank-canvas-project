import { Outlet, useParams, Link } from "react-router-dom";
import { useTenantPublic } from "@/hooks/use-loja-public";
import { CarrinhoProvider, useCarrinho } from "@/hooks/use-carrinho";
import { LojaAuthProvider, useLojaAuth } from "@/hooks/use-loja-auth";
import { CookieConsentBanner } from "@/components/loja/CookieConsentBanner";
import { ShoppingCart, Store, Package, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

function LojaNavbar() {
  const { tenantId } = useParams();
  const { count } = useCarrinho();
  const { user, cliente, loading } = useLojaAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to={`/loja/${tenantId}`} className="flex items-center gap-2 font-bold text-xl text-primary">
          <Store className="h-6 w-6" />
          <span>Loja Virtual</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/loja/${tenantId}`}>Catálogo</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/loja/${tenantId}/rastrear`}>
              <Package className="h-4 w-4 mr-1" /> Meus Pedidos
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="relative">
            <Link to={`/loja/${tenantId}/carrinho`}>
              <ShoppingCart className="h-4 w-4 mr-1" />
              Carrinho
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          {!loading && (
            user ? (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/loja/${tenantId}/conta`}>
                  <User className="h-4 w-4 mr-1" />
                  {cliente?.nome?.split(" ")[0] || "Conta"}
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/loja/${tenantId}/login`}>
                  <LogIn className="h-4 w-4 mr-1" /> Entrar
                </Link>
              </Button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

export default function LojaLayout() {
  const { tenantId } = useParams();
  const { data: tenant, isLoading, error } = useTenantPublic(tenantId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Store className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Loja não encontrada</h1>
        <p className="text-muted-foreground">Esta loja não está disponível no momento.</p>
      </div>
    );
  }

  return (
    <LojaAuthProvider tenantId={tenantId!}>
      <CarrinhoProvider tenantId={tenantId!}>
        <div className="min-h-screen bg-background flex flex-col">
          <LojaNavbar />
          <main className="flex-1 container mx-auto px-4 py-8">
            <Outlet context={{ tenant }} />
          </main>
          <footer className="border-t py-6 text-center text-sm text-muted-foreground">
            <p>{tenant.nome_grafica} — Powered by Gráfica 360°</p>
          </footer>
          <CookieConsentBanner tenantId={tenantId!} />
        </div>
      </CarrinhoProvider>
    </LojaAuthProvider>
  );
}
