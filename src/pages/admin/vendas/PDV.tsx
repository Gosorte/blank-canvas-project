import { useState, useMemo, useEffect, useRef } from "react";
import {
  CreditCard, Search, Package, Layers, Tag, ShoppingCart, Plus, Minus, Trash2, Receipt, X,
  Percent, DollarSign, Wallet, User, Key, Lock, Shield, Banknote, QrCode, FileText, ClipboardList, Loader2,
  DoorOpen, DoorClosed, Hash, History as HistoryIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FechamentoCaixa } from "@/components/vendas/FechamentoCaixa";
import { RecebimentoParcialDialog } from "@/components/vendas/RecebimentoParcialDialog";
import { HistoricoFinanceiroDialog } from "@/components/vendas/HistoricoFinanceiroDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormasPagamento } from "@/hooks/use-formas-pagamento";
import { toast } from "sonner";

interface CartItem {
  id: string;
  code: string;
  name: string;
  unitPrice: number; // in cents
  quantity: number;
  orderNumber?: number;
  orderStatus?: string;
}

const ORDER_STATUSES = ["balcao", "arte", "offset", "digital", "com_visual", "parcial"] as const;

const orderStatusLabel: Record<string, string> = {
  aguardando: "Aguardando",
  balcao: "Balcão",
  arte: "Arte",
  offset: "Offset",
  digital: "Digital",
  com_visual: "Com. Visual",
  pronto: "Pronto",
  parcial: "Parcial",
};

export default function PDV() {
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentOsNumber, setCurrentOsNumber] = useState<number | null>(null);
  const [soldProductIds, setSoldProductIds] = useState<string[]>([]);

  // Discount state
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [discountAuthorized, setDiscountAuthorized] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Client & Cashback state
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showClientList, setShowClientList] = useState(false);
  const [useCashback, setUseCashback] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showFechamento, setShowFechamento] = useState(false);
  const [showRelatorioDatePicker, setShowRelatorioDatePicker] = useState(false);
  const [relatorioDate, setRelatorioDate] = useState(new Date().toISOString().split("T")[0]);
  const [valorRecebido, setValorRecebido] = useState("");
  const [showPartialDialog, setShowPartialDialog] = useState(false);
  const [pendingPartialData, setPendingPartialData] = useState<any>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showAbrirCaixa, setShowAbrirCaixa] = useState(false);
  const [showFecharCaixa, setShowFecharCaixa] = useState(false);
  const [caixaValorAbertura, setCaixaValorAbertura] = useState("");
  const [caixaObsAbertura, setCaixaObsAbertura] = useState("");
  const [caixaObsFechamento, setCaixaObsFechamento] = useState("");
  
  const [parcialDialogOpen, setParcialDialogOpen] = useState(false);
  const [parcialItem, setParcialItem] = useState<any>(null);
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);
  const [historicoContaId, setHistoricoContaId] = useState<string | null>(null);
  const [historicoOsNumber, setHistoricoOsNumber] = useState<number | string | null>(null);
  const [historicoClienteNome, setHistoricoClienteNome] = useState("");
  const osGenerationRef = useRef<Promise<number> | null>(null);
  const queryClient = useQueryClient();

  const { data: formasPagamento } = useFormasPagamento(activeTenantId || undefined);

  // Daily sales total
  const today = new Date().toISOString().split("T")[0];
  const soldProductsStorageKey = useMemo(
    () => (activeTenantId ? `pdv-sold-products:${activeTenantId}:${today}` : null),
    [activeTenantId, today]
  );

  useEffect(() => {
    if (!soldProductsStorageKey) {
      setSoldProductIds([]);
      return;
    }

    try {
      const raw = localStorage.getItem(soldProductsStorageKey);
      setSoldProductIds(raw ? JSON.parse(raw) : []);
    } catch {
      setSoldProductIds([]);
    }
  }, [soldProductsStorageKey]);

  useEffect(() => {
    if (!soldProductsStorageKey) return;
    localStorage.setItem(soldProductsStorageKey, JSON.stringify(soldProductIds));
  }, [soldProductsStorageKey, soldProductIds]);

  const { data: dailySales } = useQuery({
    queryKey: ["pdv-daily-sales", activeTenantId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdv_vendas" as any)
        .select("total")
        .eq("tenant_id", activeTenantId!)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);
      if (error) throw error;
      const totalVendas = (data || []).reduce((sum: number, v: any) => sum + Number(v.total), 0);
      return totalVendas;
    },
    enabled: !!activeTenantId,
    refetchInterval: 5000,
  });

  const { data: dailySalesCount } = useQuery({
    queryKey: ["pdv-daily-sales-count", activeTenantId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdv_vendas" as any)
        .select("id")
        .eq("tenant_id", activeTenantId!)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);
      if (error) throw error;
      return (data || []).length;
    },
    enabled: !!activeTenantId,
    refetchInterval: 5000,
  });

  // Current open caixa session
  const { data: caixaAberto, refetch: refetchCaixa } = useQuery({
    queryKey: ["pdv-caixa-aberto", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdv_caixa" as any)
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .eq("status", "aberto")
        .order("aberto_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!activeTenantId,
  });

  const { data: profileAbriu } = useQuery({
    queryKey: ["pdv-caixa-profile", caixaAberto?.aberto_por],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", caixaAberto.aberto_por)
        .single();
      return data?.nome || "Desconhecido";
    },
    enabled: !!caixaAberto?.aberto_por,
  });

  const registerSale = useMutation({
    mutationFn: async (sale: any) => {
      const { error } = await supabase.from("pdv_vendas" as any).insert(sale as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdv-daily-sales"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-daily-sales-count"] });
    },
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["pdv-pedidos", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("erp_pedidos" as any)
        .select("id, numero, cliente_id, cliente_nome, valor_total, status, categoria, forma_pagamento, created_at")
        .eq("tenant_id", activeTenantId!)
        .neq("status", "cancelado")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user && !!activeTenantId,
  });

  // Fetch contas_receber with status "parcial" for partial payment completion
  const { data: contasParciais } = useQuery({
    queryKey: ["pdv-contas-parciais", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_receber")
        .select("id, descricao, valor, status, cliente_id, clientes(nome), observacoes, created_at")
        .eq("tenant_id", activeTenantId!)
        .eq("status", "parcial")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user && !!activeTenantId,
  });

  // Fetch recebimentos parciais for all contas parciais to show received amounts
  const contasParciaisIds = useMemo(() => (contasParciais || []).map((c: any) => c.id), [contasParciais]);
  const { data: recebimentosParciais } = useQuery({
    queryKey: ["pdv-recebimentos-parciais", contasParciaisIds],
    queryFn: async () => {
      if (contasParciaisIds.length === 0) return [];
      const { data, error } = await supabase
        .from("recebimentos_parciais" as any)
        .select("conta_receber_id, valor")
        .in("conta_receber_id", contasParciaisIds);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: contasParciaisIds.length > 0,
  });

  // Aggregate received amounts per conta
  const recebidoPorConta = useMemo(() => {
    const map: Record<string, number> = {};
    (recebimentosParciais || []).forEach((r: any) => {
      map[r.conta_receber_id] = (map[r.conta_receber_id] || 0) + Number(r.valor);
    });
    return map;
  }, [recebimentosParciais]);

  // Extract OS number from conta descricao (format: "OS-123 - Venda PDV")
  const extractOsNumber = (desc: string): number | null => {
    const match = desc?.match(/OS-(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const osParciaisSet = useMemo(() => {
    const set = new Set<number>();
    (contasParciais || []).forEach((conta: any) => {
      const osNum = extractOsNumber(conta.descricao);
      if (osNum) set.add(osNum);
    });
    return set;
  }, [contasParciais]);

  const { data: clients } = useQuery({
    queryKey: ["pdv-clients", activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, telefone")
        .eq("tenant_id", activeTenantId!)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!activeTenantId,
  });

  const { data: clientCredit } = useQuery({
    queryKey: ["pdv-client-credit", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      const { data, error } = await supabase
        .from("customer_credits")
        .select("*")
        .eq("cliente_id", selectedClientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClientId,
  });

  const filteredClients = useMemo(() => {
    if (!clients || !clientSearch) return [];
    const term = clientSearch.toLowerCase();
    return clients
      .filter((c) => c.nome.toLowerCase().includes(term) || c.telefone?.includes(term))
      .slice(0, 6);
  }, [clients, clientSearch]);

  const selectedClient = useMemo(
    () => clients?.find((c) => c.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );

  // Filter pedidos
  const filteredProducts = useMemo(() => {
    if (selectedStatus === "parcial") return []; // parciais handled separately
    if (!products) return [];
    return products.filter((p: any) => {
      // Exclude aguardando, pronto e parcial da seção de pedidos
      if (p.status === "aguardando" || p.status === "pronto" || p.status === "parcial") return false;

      const isAlreadySold = soldProductIds.includes(p.id);
      const osNumero = Number(p.numero || 0);
      const isAlreadyPartial = osNumero > 0 && osParciaisSet.has(osNumero);

      const matchSearch =
        !searchTerm ||
        p.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.numero || "").includes(searchTerm.toLowerCase());
      const matchStatus = !selectedStatus || p.status === selectedStatus;

      return !isAlreadySold && !isAlreadyPartial && matchSearch && matchStatus;
    });
  }, [products, searchTerm, selectedStatus, soldProductIds, osParciaisSet]);

  // Filter contas parciais
  const filteredParciais = useMemo(() => {
    if (selectedStatus && selectedStatus !== "parcial") return [];
    if (!contasParciais) return [];
    return contasParciais.filter((c: any) => {
      const osNum = extractOsNumber(c.descricao);
      const clienteName = c.clientes?.nome || "";
      const matchSearch =
        !searchTerm ||
        clienteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(osNum || "").includes(searchTerm);
      return matchSearch;
    });
  }, [contasParciais, searchTerm, selectedStatus]);

  const addToCart = (product: any) => {
    if (!caixaAberto) {
      toast.error("🔒 Caixa fechado — abra o caixa para realizar recebimentos.", { style: { background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', border: 'none' } });
      return;
    }
    setCurrentOsNumber(Number(product.numero) || null);
    setSelectedClientId(product.cliente_id || null);
    if (product.forma_pagamento) {
      setPaymentMethod(product.forma_pagamento);
    }

    setCart([
      {
        id: product.id,
        code: `PED-${product.numero}`,
        name: product.cliente_nome,
        unitPrice: Math.round(Number(product.valor_total || 0) * 100),
        quantity: 1,
        orderNumber: product.numero,
        orderStatus: product.status,
      },
    ]);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((i) => (i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0);

      if (next.length === 0) {
        setCurrentOsNumber(null);
        osGenerationRef.current = null;
      }

      return next;
    });
  };

  const removeFromCart = (id: string) =>
    setCart((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) {
        setCurrentOsNumber(null);
        osGenerationRef.current = null;
      }
      return next;
    });

  // All monetary values in cents
  const cartSubtotal = useMemo(() => cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [cart]);
  const cartItemsCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  const maxDiscountPercent = useMemo(() => {
    if (!clientCredit) return 5;
    return Number((clientCredit as any).desconto_max_percentual ?? 5);
  }, [clientCredit]);

  const discountPercent = useMemo(() => {
    const val = parseFloat(discountValue);
    if (!val || val <= 0 || cartSubtotal === 0) return 0;
    if (discountType === "percent") return val;
    const fixedCents = Math.round(val * 100);
    return (fixedCents / cartSubtotal) * 100;
  }, [discountValue, discountType, cartSubtotal]);

  const needsAuthorization = discountPercent > maxDiscountPercent && !discountAuthorized;

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountValue);
    if (!val || val <= 0) return 0;
    if (needsAuthorization) return 0;
    if (discountType === "percent") {
      const capped = Math.min(val, 100);
      return Math.round(cartSubtotal * (capped / 100));
    }
    const fixedCents = Math.round(val * 100);
    return Math.min(fixedCents, cartSubtotal);
  }, [discountValue, discountType, cartSubtotal, needsAuthorization]);

  const afterDiscount = cartSubtotal - discountAmount;

  const cashbackAmount = useMemo(() => {
    if (!useCashback || !clientCredit) return 0;
    const available = Math.round(((clientCredit as any).saldo_cashback ?? 0) * 100);
    return Math.min(available, afterDiscount);
  }, [useCashback, clientCredit, afterDiscount]);

  const cartTotal = afterDiscount - cashbackAmount;

  // Format cents to BRL
  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const handleVerifyAuthCode = async () => {
    if (!authCode.trim()) {
      toast.error("Digite o código de autorização");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("discount_authorizations")
        .select("*")
        .eq("codigo", authCode.trim().toUpperCase())
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Código inválido ou expirado");
        return;
      }

      if (new Date((data as any).expira_em) < new Date()) {
        toast.error("Código expirado");
        return;
      }

      await supabase
        .from("discount_authorizations")
        .update({
          status: "used",
          usado_por: user?.id,
          usado_em: new Date().toISOString(),
          valor_desconto: discountAmount / 100,
          valor_venda: cartSubtotal / 100,
        } as any)
        .eq("id", (data as any).id);

      setDiscountAuthorized(true);
      setShowAuthDialog(false);
      toast.success("Desconto autorizado!");
    } catch (e: any) {
      toast.error("Erro ao verificar código: " + e.message);
    }
  };

  const handleGenerateCode = async () => {
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from("discount_authorizations").insert({
        codigo: code,
        autorizado_por: user!.id,
        desconto_percentual: discountPercent,
        cliente_id: selectedClientId,
        tenant_id: activeTenantId,
      } as any);
      if (error) throw error;
      toast.success(`Código gerado: ${code}`, { duration: 10000 });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const defaultPaymentLabels: Record<string, string> = {
    dinheiro: "Dinheiro", pix: "PIX", credito: "Cartão de Crédito",
    debito: "Cartão de Débito", boleto: "Boleto", transferencia: "Transferência",
    cheque: "Cheque", crediario: "Crediário",
  };

  const getPaymentLabel = (value: string) => {
    const found = formasPagamento?.find((fp) => fp.id === value);
    if (found) return found.nome;
    return defaultPaymentLabels[value] || value;
  };

  const valorRecebidoCents = useMemo(() => {
    const v = parseFloat(valorRecebido);
    if (!v || v <= 0) return 0;
    return Math.round(v * 100);
  }, [valorRecebido]);

  const isPartialPayment = valorRecebidoCents > 0 && valorRecebidoCents < cartTotal - 1;

  const buildSaleData = () => {
    if (!currentOsNumber) {
      toast.error("Não foi possível identificar a OS da venda. Tente novamente.");
      return null;
    }

    const soldIds = Array.from(new Set(cart.map((i) => i.id)));
    const saleItems = cart.map((i) => ({
      id: i.id, code: i.code, name: i.name,
      unitPrice: i.unitPrice / 100, quantity: i.quantity,
      total: (i.unitPrice * i.quantity) / 100,
    }));
    const saleLabel = getPaymentLabel(paymentMethod);
    const saleClientId = selectedClientId;
    const saleCartDesc = cart.map((i) => `${i.name} x${i.quantity}`).join(", ");
    return {
      soldIds,
      saleItems,
      saleLabel,
      saleClientId,
      saleCartDesc,
      subtotalCents: cartSubtotal,
      discountCents: discountAmount,
      cashbackCents: cashbackAmount,
      totalCents: cartTotal,
      receivedCents: valorRecebidoCents,
      osNumber: currentOsNumber,
    };
  };

  const handleAbrirCaixa = async () => {
    try {
      const valorAb = parseFloat(caixaValorAbertura) || 0;
      await (supabase.from("pdv_caixa" as any) as any).insert({
        tenant_id: activeTenantId,
        aberto_por: user?.id,
        valor_abertura: valorAb,
        observacoes_abertura: caixaObsAbertura || null,
        status: "aberto",
      });
      refetchCaixa();
      setShowAbrirCaixa(false);
      setCaixaValorAbertura("");
      setCaixaObsAbertura("");
      toast.success("Caixa aberto com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao abrir caixa: " + e.message);
    }
  };

  const handleFecharCaixa = async () => {
    if (!caixaAberto) return;
    try {
      const totalVendido = dailySales || 0;
      await (supabase.from("pdv_caixa" as any) as any)
        .update({
          fechado_por: user?.id,
          fechado_em: new Date().toISOString(),
          total_vendas: totalVendido,
          total_recebido: totalVendido + Number(caixaAberto.valor_abertura || 0),
          valor_fechamento: totalVendido + Number(caixaAberto.valor_abertura || 0),
          observacoes_fechamento: caixaObsFechamento || null,
          status: "fechado",
        })
        .eq("id", caixaAberto.id);
      refetchCaixa();
      setShowFecharCaixa(false);
      setCaixaObsFechamento("");
      toast.success("Caixa fechado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao fechar caixa: " + e.message);
    }
  };

  const handleFinalize = async () => {
    if (isFinalizing) return;

    if (!caixaAberto) {
      toast.warning("Abra o caixa antes de finalizar uma venda.");
      return;
    }
    if (cart.length === 0) {
      toast.warning("Adicione produtos ao carrinho antes de finalizar.");
      return;
    }
    if (!paymentMethod) {
      toast.warning("Selecione uma forma de pagamento.");
      return;
    }
    if (!selectedClientId) {
      toast.warning("Selecione um cliente para finalizar a venda.");
      return;
    }

    if (valorRecebidoCents > cartTotal) {
      toast.warning("O valor recebido não pode ser maior que o total da venda.");
      return;
    }

    // Check if partial payment
    if (isPartialPayment) {
      // First payment must be at least 40% of the total
      const minFirstPayment = Math.ceil(cartTotal * 0.4);
      if (valorRecebidoCents < minFirstPayment) {
        toast.warning(`O primeiro recebimento deve ser de no mínimo 40% do valor (${formatCurrency(minFirstPayment)}).`);
        return;
      }
      const saleData = buildSaleData();
      if (!saleData) return;
      setPendingPartialData(saleData);
      setShowPartialDialog(true);
      return;
    }

    await executeSale(false);
  };

  const executeSale = async (partial: boolean) => {
    if (isFinalizing) return;

    setIsFinalizing(true);
    try {
      const saleData = pendingPartialData || buildSaleData();
      if (!saleData) return;

      const {
        soldIds,
        saleItems,
        saleLabel,
        saleClientId,
        saleCartDesc,
        subtotalCents,
        discountCents,
        cashbackCents,
        totalCents,
        receivedCents,
        osNumber,
      } = saleData;
      const saleTotal = totalCents;
      const receivedAmount = partial ? receivedCents : saleTotal;
      const remainingAmount = saleTotal - receivedAmount;

      // Clear screen IMMEDIATELY
      setCart([]);
      setCurrentOsNumber(null);
      osGenerationRef.current = null;
      setDiscountValue("");
      setUseCashback(false);
      setDiscountAuthorized(false);
      setPaymentMethod("");
      setSelectedClientId(null);
      setClientSearch("");
      setValorRecebido("");
      setShowPartialDialog(false);
      setPendingPartialData(null);
      
      // Register sale in pdv_vendas with the pre-generated OS number
      await (supabase.from("pdv_vendas" as any) as any).insert({
        tenant_id: activeTenantId,
        cliente_id: saleClientId || null,
        usuario_id: user?.id || null,
        subtotal: subtotalCents / 100,
        desconto: discountCents / 100,
        cashback_usado: cashbackCents / 100,
        total: receivedAmount / 100,
        forma_pagamento: saleLabel,
        itens: saleItems,
        numero_venda: osNumber,
      });
      queryClient.invalidateQueries({ queryKey: ["pdv-daily-sales"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-daily-sales-count"] });

      if (partial) {
        // Check if conta_receber already exists for this OS
        const { data: existingConta } = await supabase
          .from("contas_receber")
          .select("id")
          .eq("tenant_id", activeTenantId!)
          .eq("descricao", `OS-${osNumber} - Venda PDV`)
          .in("status", ["pendente", "parcial"])
          .maybeSingle();

        let contaId: string | null = existingConta?.id || null;

        if (!contaId) {
          // Create conta_receber with status "parcial"
          const { data: contaData } = await supabase.from("contas_receber").insert({
            tenant_id: activeTenantId,
            cliente_id: saleClientId || null,
            descricao: `OS-${osNumber} - Venda PDV`,
            valor: saleTotal / 100,
            data_vencimento: new Date().toISOString().split("T")[0],
            status: "parcial",
            forma_pagamento: saleLabel,
            observacoes: `OS-${osNumber} | ${saleCartDesc} | Recebido parcialmente: R$ ${(receivedAmount / 100).toFixed(2)} de R$ ${(saleTotal / 100).toFixed(2)}`,
          }).select("id").single();
          contaId = contaData?.id || null;
        }

        // Register partial payment
        if (contaId) {
          await supabase.from("recebimentos_parciais" as any).insert({
            tenant_id: activeTenantId,
            conta_receber_id: contaId,
            valor: receivedAmount / 100,
            forma_pagamento: saleLabel,
            data_recebimento: new Date().toISOString().split("T")[0],
            registrado_por: user?.id || null,
            observacoes: "Recebimento parcial no PDV",
          } as any);
        }

        toast.success(
          `OS-${osNumber} | Parcial ${formatCurrency(receivedAmount)} registrado! Restante: ${formatCurrency(remainingAmount)}`
        );
      } else {
        // Check if conta_receber already exists for this OS
        const { data: existingFullConta } = await supabase
          .from("contas_receber")
          .select("id")
          .eq("tenant_id", activeTenantId!)
          .eq("descricao", `OS-${osNumber} - Venda PDV`)
          .in("status", ["pendente", "parcial"])
          .maybeSingle();

        let contaFullId: string | null = null;

        if (existingFullConta) {
          // Update existing conta to recebido
          await supabase.from("contas_receber")
            .update({ status: "recebido", data_recebimento: new Date().toISOString().split("T")[0], forma_pagamento: saleLabel })
            .eq("id", existingFullConta.id);
          contaFullId = existingFullConta.id;
        } else {
          // Full payment - conta recebida
          const { data: contaFullData } = await supabase.from("contas_receber").insert({
            tenant_id: activeTenantId,
            cliente_id: saleClientId || null,
            descricao: `OS-${osNumber} - Venda PDV`,
            valor: saleTotal / 100,
            data_vencimento: new Date().toISOString().split("T")[0],
            data_recebimento: new Date().toISOString().split("T")[0],
            status: "recebido",
            forma_pagamento: saleLabel,
            observacoes: `OS-${osNumber} | ${saleCartDesc}`,
          }).select("id").single();
          contaFullId = contaFullData?.id || null;
        }

        // Register full payment in recebimentos_parciais for financial history
        if (contaFullId) {
          await supabase.from("recebimentos_parciais" as any).insert({
            tenant_id: activeTenantId,
            conta_receber_id: contaFullId,
            valor: saleTotal / 100,
            forma_pagamento: saleLabel,
            data_recebimento: new Date().toISOString().split("T")[0],
            registrado_por: user?.id || null,
            observacoes: "Pagamento integral no PDV",
          } as any);
        }

        toast.success(`OS-${osNumber} | Venda de ${formatCurrency(saleTotal)} finalizada! Pagamento: ${saleLabel}`);

        // Mark pedido as "pronto" after full payment
        for (const sid of soldIds) {
          await supabase.from("erp_pedidos").update({ status: "pronto" } as any).eq("id", sid);
        }
      }

      setSoldProductIds((prev) => Array.from(new Set([...prev, ...soldIds])));
      queryClient.invalidateQueries({ queryKey: ["pdv-pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-contas-parciais"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-recebimentos-parciais"] });
      queryClient.invalidateQueries({ queryKey: ["contas-receber"] });
      queryClient.invalidateQueries({ queryKey: ["contas-receber-all"] });
      queryClient.invalidateQueries({ queryKey: ["recebimentos-parciais"] });
    } catch (e: any) {
      toast.error("Erro ao registrar venda: " + e.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleSelectClient = (id: string) => {
    setSelectedClientId(id);
    setShowClientList(false);
    setClientSearch("");
    setUseCashback(false);
  };

  const handleClearClient = () => {
    setSelectedClientId(null);
    setClientSearch("");
    setUseCashback(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary" />
            Ponto de Venda
          </h1>
          <p className="text-sm text-muted-foreground">
            Recebimento rápido de pedidos existentes
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Caixa open/close buttons */}
          {!caixaAberto ? (
            <Button variant="default" size="sm" className="gap-1.5" onClick={() => setShowAbrirCaixa(true)}>
              <DoorOpen className="h-4 w-4" /> Abrir Caixa
            </Button>
          ) : (
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setShowFecharCaixa(true)}>
              <DoorClosed className="h-4 w-4" /> Fechar Caixa
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
            setRelatorioDate(new Date().toISOString().split("T")[0]);
            setShowFechamento(true);
          }}>
            <ClipboardList className="h-4 w-4" /> Relatório
          </Button>
          <div className="text-right border border-border rounded-md px-3 py-1.5 bg-card">
            <p className="text-[10px] text-muted-foreground">Caixa do dia</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(Math.round((dailySales || 0) * 100))}
            </p>
            <p className="text-[10px] text-muted-foreground">{dailySalesCount || 0} vendas</p>
          </div>
          {caixaAberto && (
            <div className="text-right border border-primary/30 rounded-md px-3 py-1.5 bg-primary/5">
              <p className="text-[10px] text-muted-foreground">Caixa aberto por</p>
              <p className="text-xs font-medium text-foreground">{profileAbriu || "..."}</p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(caixaAberto.aberto_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                {" · Troco: "}
                {formatCurrency(Math.round(Number(caixaAberto.valor_abertura || 0) * 100))}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 min-h-0">
        {/* Left: Product catalog */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Search bars */}
          <div className="flex gap-2 mt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, número ou OS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Group filter chips */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedStatus(null)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 border ${
                !selectedStatus
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <Layers className="h-3 w-3" />
              Todos
            </button>
            {ORDER_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 border ${
                  selectedStatus === status
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Tag className="h-3 w-3" />
                {orderStatusLabel[status]}
              </button>
            ))}
          </div>



          {/* Product grid */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none pb-3 pt-1">
            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-sm border border-border bg-card p-4 animate-pulse h-20"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 && filteredParciais.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <Package className="h-14 w-14 opacity-40" />
                  <p className="text-sm">Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pedidos section (first) */}
                {filteredProducts.length > 0 && (
                  <div>
                    {filteredParciais.length > 0 && (
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        Pedidos ({filteredProducts.length})
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredProducts.map((product: any) => {
                        const inCart = cart.find((i) => i.id === product.id);
                        return (
                          <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className={`group relative text-left rounded-sm border p-3 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex flex-col gap-1 ${
                              inCart
                                ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                                : "border-border bg-card hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col items-start gap-1 min-w-0">
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5 font-mono w-fit border-primary/50 text-primary bg-primary/10"
                                >
                                  Pedido #{product.numero}
                                </Badge>
                                {!!product.status && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs px-2 py-0.5 w-fit text-muted-foreground"
                                  >
                                    {orderStatusLabel[product.status] || product.status}
                                  </Badge>
                                )}
                              </div>
                              {inCart && (
                                <Badge
                                  variant="default"
                                  className="text-xs px-2 py-0.5 min-w-7 justify-center"
                                >
                                  Selecionado
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground leading-tight">
                              {product.cliente_nome}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {product.categoria || "Sem categoria"}
                            </p>
                            <p className="text-base font-bold text-primary mt-auto">
                              {formatCurrency(Math.round(Number(product.valor_total || 0) * 100))}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Contas parciais section (below pedidos) */}
                {filteredParciais.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
                      <Banknote className="h-3.5 w-3.5" />
                      Recebimentos Parciais ({filteredParciais.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredParciais.map((conta: any) => {
                        const osNum = extractOsNumber(conta.descricao);
                        const valorTotal = Number(conta.valor || 0);
                        const valorRecebidoConta = recebidoPorConta[conta.id] || 0;
                        const valorRestante = valorTotal - valorRecebidoConta;
                        return (
                          <div
                            key={`parcial-${conta.id}`}
                            className="group relative text-left rounded-sm border border-amber-500/40 bg-amber-500/5 p-3 transition-all duration-200 hover:shadow-md hover:border-amber-500/60 flex flex-col gap-1"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col items-start gap-1 min-w-0">
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5 font-mono w-fit border-amber-500/50 text-amber-700 bg-amber-500/10"
                                >
                                  OS-{osNum || "?"}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5 w-fit border-amber-500/30 text-amber-600 bg-amber-500/10"
                                >
                                  <Banknote className="h-3 w-3 mr-1" />
                                  Parcial
                                </Badge>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistoricoContaId(conta.id);
                                  setHistoricoOsNumber(osNum);
                                  setHistoricoClienteNome(conta.clientes?.nome || "—");
                                  setHistoricoDialogOpen(true);
                                }}
                                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-sm hover:bg-primary/10"
                                title="Histórico Financeiro"
                              >
                                <HistoryIcon className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-sm font-medium text-foreground leading-tight">
                              {conta.clientes?.nome || "—"}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <div className="text-[10px] text-emerald-600 font-medium">
                                Recebido: {formatCurrency(Math.round(valorRecebidoConta * 100))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                              <p className="text-base font-bold text-amber-600">
                                Restante: {formatCurrency(Math.round(valorRestante * 100))}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] gap-1 border-amber-500/40 text-amber-700 hover:bg-amber-500/10"
                                onClick={() => {
                                  if (!caixaAberto) {
                                    toast.error("🔒 Caixa fechado — abra o caixa para realizar recebimentos.", { style: { background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))', border: 'none' } });
                                    return;
                                  }
                                  setParcialItem(conta);
                                  setParcialDialogOpen(true);
                                }}
                              >
                                <DollarSign className="h-3 w-3" /> Receber
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="flex flex-col rounded-sm border border-border bg-card overflow-hidden">
          {/* Cart header */}
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Carrinho
            </h2>
            <Badge
              variant="outline"
              className={`font-mono text-sm px-2.5 ${
                currentOsNumber ? "border-primary/40 text-primary" : "text-muted-foreground"
              }`}
            >
              {currentOsNumber ? `OS-${currentOsNumber}` : "OS pendente"}
            </Badge>
          </div>

          {/* Cart items */}
          <ScrollArea className="flex-1 min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <ShoppingCart className="h-10 w-10 opacity-30" />
                <p className="text-xs">Selecione produtos ao lado</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-sm border border-border bg-background/50 p-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </p>
                      {item.orderNumber && (
                        <p className="text-[11px] font-mono text-primary">Pedido #{item.orderNumber}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{item.orderStatus ? (orderStatusLabel[item.orderStatus] || item.orderStatus) : ""}</p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Cart footer */}
          <div className="border-t border-border p-4 space-y-3 bg-muted/20">
            {/* Client selector */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Cliente *
              </Label>
              {selectedClient ? (
                <div className="flex items-center gap-2 rounded-sm border border-primary/30 bg-primary/5 px-3 py-2">
                  <User className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground flex-1 truncate">
                    {selectedClient.nome}
                  </span>
                  <button
                    onClick={handleClearClient}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientList(e.target.value.length > 0);
                    }}
                    onFocus={() => clientSearch && setShowClientList(true)}
                    onBlur={() => setTimeout(() => setShowClientList(false), 200)}
                    className="h-8 text-xs"
                  />
                  {showClientList && filteredClients.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                      {filteredClients.map((c) => (
                        <button
                          key={c.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectClient(c.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                        >
                          {c.nome}
                          {c.telefone && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {c.telefone}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual discount */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Desconto</Label>
              <div className="flex items-center gap-1.5">
                <div className="flex rounded-md border border-border overflow-hidden">
                  <button
                    onClick={() => setDiscountType("percent")}
                    className={`px-2 py-1.5 text-xs transition-colors ${
                      discountType === "percent"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Percent className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setDiscountType("fixed")}
                    className={`px-2 py-1.5 text-xs transition-colors ${
                      discountType === "fixed"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <DollarSign className="h-3 w-3" />
                  </button>
                </div>
                <Input
                  type="number"
                  min="0"
                  step={discountType === "percent" ? "1" : "0.01"}
                  max={discountType === "percent" ? "100" : undefined}
                  placeholder={discountType === "percent" ? "0 %" : "0,00"}
                  value={discountValue}
                  onChange={(e) => {
                    setDiscountValue(e.target.value);
                    setDiscountAuthorized(false);
                  }}
                  className="h-8 text-xs flex-1"
                />
                {discountAmount > 0 && (
                  <span className="text-xs font-medium text-destructive whitespace-nowrap">
                    -{formatCurrency(discountAmount)}
                  </span>
                )}
              </div>
              {/* Authorization warning */}
              {needsAuthorization && (
                <div className="flex items-center justify-between rounded-sm border border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-orange-600" />
                    <div>
                      <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                        Desconto acima de {maxDiscountPercent}%
                      </p>
                      <p className="text-[10px] text-orange-600 dark:text-orange-500">
                        Requer código de autorização do gestor
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1"
                      onClick={handleGenerateCode}
                    >
                      <Key className="h-3 w-3" /> Gerar Código
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => {
                        setAuthCode("");
                        setShowAuthDialog(true);
                      }}
                    >
                      <Key className="h-3 w-3" /> Inserir Código
                    </Button>
                  </div>
                </div>
              )}
              {discountAuthorized && discountPercent > maxDiscountPercent && (
                <div className="flex items-center gap-2 text-[10px] text-green-600">
                  <Shield className="h-3 w-3" /> Desconto autorizado por código
                </div>
              )}
            </div>

            {/* Cashback toggle */}
            {selectedClient && clientCredit && ((clientCredit as any).saldo_cashback ?? 0) > 0 && (
              <div className="flex items-center justify-between rounded-sm border border-border bg-background/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Usar Cashback</p>
                    <p className="text-[10px] text-muted-foreground">
                      Disponível: {formatCurrency(Math.round(((clientCredit as any).saldo_cashback ?? 0) * 100))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {useCashback && cashbackAmount > 0 && (
                    <span className="text-xs font-medium text-destructive">
                      -{formatCurrency(cashbackAmount)}
                    </span>
                  )}
                  <Switch checked={useCashback} onCheckedChange={setUseCashback} />
                </div>
              </div>
            )}

            <Separator />

            {/* Payment method */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Banknote className="h-3 w-3" /> Forma de Pagamento
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {formasPagamento && formasPagamento.length > 0 ? (
                    formasPagamento.map((fp) => (
                      <SelectItem key={fp.id} value={fp.id}>
                        <span className="flex items-center gap-2">
                          <Banknote className="h-3.5 w-3.5" /> {fp.nome}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="dinheiro">
                        <span className="flex items-center gap-2"><Banknote className="h-3.5 w-3.5" /> Dinheiro</span>
                      </SelectItem>
                      <SelectItem value="pix">
                        <span className="flex items-center gap-2"><QrCode className="h-3.5 w-3.5" /> PIX</span>
                      </SelectItem>
                      <SelectItem value="credito">
                        <span className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Cartão de Crédito</span>
                      </SelectItem>
                      <SelectItem value="debito">
                        <span className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Cartão de Débito</span>
                      </SelectItem>
                      <SelectItem value="boleto">
                        <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Boleto</span>
                      </SelectItem>
                      <SelectItem value="transferencia">
                        <span className="flex items-center gap-2"><DollarSign className="h-3.5 w-3.5" /> Transferência</span>
                      </SelectItem>
                      <SelectItem value="cheque">
                        <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Cheque</span>
                      </SelectItem>
                      <SelectItem value="crediario">
                        <span className="flex items-center gap-2"><Wallet className="h-3.5 w-3.5" /> Crediário</span>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Valor Recebido */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Valor Recebido
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder={cartTotal > 0 ? `Total: ${formatCurrency(cartTotal)}` : "0,00"}
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                className="h-9 text-sm"
              />
              {isPartialPayment && (
                <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-sm px-2 py-1.5 border border-amber-200 dark:border-amber-800">
                  <span>⚠ Recebimento parcial</span>
                  <span className="font-medium">Restante: {formatCurrency(cartTotal - valorRecebidoCents)}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-1">
              {(discountAmount > 0 || cashbackAmount > 0) && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-destructive">
                  <span>
                    Desconto {discountType === "percent" ? `(${discountValue}%)` : ""}
                  </span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              {cashbackAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-destructive">
                  <span>Cashback</span>
                  <span>-{formatCurrency(cashbackAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {cartItemsCount} itens
                </span>
                <span className="text-xl font-bold text-foreground">
                  {formatCurrency(cartTotal)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={cart.length === 0}
                onClick={() => {
                  setCart([]);
                  setCurrentOsNumber(null);
                  osGenerationRef.current = null;
                  setDiscountValue("");
                  setUseCashback(false);
                  setDiscountAuthorized(false);
                  setPaymentMethod("");
                  setValorRecebido("");
                }}
              >
                Limpar
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={cart.length === 0 || needsAuthorization || !paymentMethod || !selectedClientId || isFinalizing}
                onClick={handleFinalize}
              >
                {isFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {isFinalizing ? "Processando..." : "Finalizar"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Authorization Code Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Código de Autorização
            </DialogTitle>
            <DialogDescription>
              O desconto de {discountPercent.toFixed(1)}% excede o limite de{" "}
              {maxDiscountPercent}%. Solicite o código ao gestor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Código</Label>
              <Input
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
                placeholder="Ex: A1B2C3"
                className="font-mono text-center text-lg tracking-widest"
                maxLength={8}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleVerifyAuthCode} disabled={!authCode.trim()}>
              Verificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date picker for report */}
      <Dialog open={showRelatorioDatePicker} onOpenChange={setShowRelatorioDatePicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Selecionar Data do Relatório
            </DialogTitle>
            <DialogDescription>Escolha a data para gerar o relatório completo de caixa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-sm">Data</Label>
            <Input
              type="date"
              value={relatorioDate}
              onChange={(e) => setRelatorioDate(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRelatorioDatePicker(false)}>Cancelar</Button>
            <Button onClick={() => {
              setShowRelatorioDatePicker(false);
              setShowFechamento(true);
            }} className="gap-1.5">
              <FileText className="h-4 w-4" /> Gerar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fechamento de Caixa */}
      <FechamentoCaixa open={showFechamento} onClose={() => setShowFechamento(false)} initialDate={relatorioDate} />

      {/* Partial Payment Confirmation Dialog */}
      <Dialog open={showPartialDialog} onOpenChange={(open) => {
        setShowPartialDialog(open);
        if (!open) setPendingPartialData(null);
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Recebimento Parcial
            </DialogTitle>
            <DialogDescription>
              O valor recebido é menor que o total da venda. Deseja registrar como recebimento parcial?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-md border border-border bg-muted/30">
                <p className="text-[10px] text-muted-foreground">Total</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(cartTotal)}</p>
              </div>
              <div className="text-center p-3 rounded-md border border-border bg-emerald-500/10">
                <p className="text-[10px] text-muted-foreground">Recebido</p>
                <p className="text-sm font-bold text-emerald-600">{formatCurrency(valorRecebidoCents)}</p>
              </div>
              <div className="text-center p-3 rounded-md border border-border bg-amber-500/10">
                <p className="text-[10px] text-muted-foreground">Restante</p>
                <p className="text-sm font-bold text-amber-600">{formatCurrency(cartTotal - valorRecebidoCents)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              O valor restante ficará registrado em Contas a Receber para recebimento posterior.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPartialDialog(false); setPendingPartialData(null); }}>
              Cancelar
            </Button>
            <Button onClick={() => executeSale(true)} className="gap-1.5" disabled={isFinalizing}>
              {isFinalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
              {isFinalizing ? "Processando..." : "Confirmar Parcial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Abrir Caixa Dialog */}
      <Dialog open={showAbrirCaixa} onOpenChange={setShowAbrirCaixa}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-primary" />
              Abrir Caixa
            </DialogTitle>
            <DialogDescription>
              Registre a abertura do caixa com o valor de troco inicial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Operator info */}
            <div className="p-3 rounded-md border border-primary/20 bg-primary/5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Operador</p>
                  <p className="text-sm font-semibold text-foreground">{user?.email?.split("@")[0] || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Data / Hora</p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date().toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "2-digit",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">Valor de Abertura (Troco)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={caixaValorAbertura}
                onChange={(e) => setCaixaValorAbertura(e.target.value)}
                className="font-mono text-lg"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea
                placeholder="Observações da abertura..."
                value={caixaObsAbertura}
                onChange={(e) => setCaixaObsAbertura(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbrirCaixa(false)}>Cancelar</Button>
            <Button onClick={handleAbrirCaixa} className="gap-1.5">
              <DoorOpen className="h-4 w-4" /> Abrir Caixa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fechar Caixa Dialog */}
      <Dialog open={showFecharCaixa} onOpenChange={setShowFecharCaixa}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorClosed className="h-5 w-5 text-destructive" />
              Fechar Caixa
            </DialogTitle>
            <DialogDescription>
              Confirme o fechamento do caixa. Os dados serão armazenados para controle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Operator info - abertura e fechamento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md border border-border bg-muted/30">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Abertura</p>
                <p className="text-xs font-bold text-foreground mt-1">
                  {caixaAberto ? new Date(caixaAberto.aberto_em).toLocaleString("pt-BR", {
                    day: "2-digit", month: "2-digit", year: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  }) : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Por: <strong className="text-foreground">{profileAbriu || "..."}</strong>
                </p>
              </div>
              <div className="p-3 rounded-md border border-destructive/20 bg-destructive/5">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Fechamento</p>
                <p className="text-xs font-bold text-foreground mt-1">
                  {new Date().toLocaleString("pt-BR", {
                    day: "2-digit", month: "2-digit", year: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Por: <strong className="text-foreground">{user?.email?.split("@")[0] || "—"}</strong>
                </p>
              </div>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-md border border-border bg-muted/30 text-center">
                <p className="text-[10px] text-muted-foreground">Troco Inicial</p>
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(Math.round(Number(caixaAberto?.valor_abertura || 0) * 100))}
                </p>
              </div>
              <div className="p-3 rounded-md border border-primary/30 bg-primary/5 text-center">
                <p className="text-[10px] text-muted-foreground">Total Vendas</p>
                <p className="text-sm font-bold text-primary">
                  {formatCurrency(Math.round((dailySales || 0) * 100))}
                </p>
              </div>
              <div className="p-3 rounded-md border border-border bg-muted/30 text-center">
                <p className="text-[10px] text-muted-foreground">Transações</p>
                <p className="text-sm font-bold text-foreground">{dailySalesCount || 0}</p>
              </div>
            </div>

            <div className="p-4 rounded-md border-2 border-primary/30 bg-primary/5 text-center">
              <p className="text-[10px] text-muted-foreground">Total Esperado no Caixa</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(Math.round(((dailySales || 0) + Number(caixaAberto?.valor_abertura || 0)) * 100))}
              </p>
            </div>

            <div>
              <Label className="text-xs">Observações do Fechamento</Label>
              <Textarea
                placeholder="Observações, divergências, ocorrências..."
                value={caixaObsFechamento}
                onChange={(e) => setCaixaObsFechamento(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFecharCaixa(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleFecharCaixa} className="gap-1.5">
              <DoorClosed className="h-4 w-4" /> Confirmar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <RecebimentoParcialDialog
        open={parcialDialogOpen}
        onOpenChange={(open) => {
          setParcialDialogOpen(open);
          if (!open) {
            setParcialItem(null);
            queryClient.invalidateQueries({ queryKey: ["pdv-contas-parciais"] });
          }
        }}
        conta={parcialItem}
        caixaAberto={!!caixaAberto}
      />
      <HistoricoFinanceiroDialog
        open={historicoDialogOpen}
        onOpenChange={(open) => {
          setHistoricoDialogOpen(open);
          if (!open) setHistoricoContaId(null);
        }}
        contaReceberId={historicoContaId}
        osNumber={historicoOsNumber}
        clienteNome={historicoClienteNome}
      />
    </div>
  );
}
