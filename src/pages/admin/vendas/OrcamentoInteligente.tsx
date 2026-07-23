import { useState, useMemo } from "react";
import { Calculator, Printer, Layers, Image, Save, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { calcDigital, calcOffset, calcCV, calcFinancials, type DigitalInputs, type OffsetInputs, type CVInputs } from "@/hooks/use-smart-quote-calc";


const formatBRL = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function OrcamentoInteligente() {
  const { user } = useAuth();
  const { activeTenantId } = useTenant();
  const [activeTab, setActiveTab] = useState("digital");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [markup, setMarkup] = useState(50);

  const [digital, setDigital] = useState<DigitalInputs>({ quantity: 1000, paperCost: 0.15, clickCost: 0.08, clickType: "cmyk", sides: 1, poses: 1 });
  const [offset, setOffset] = useState<OffsetInputs>({ runSize: 5000, ctpCost: 120, setupTime: 0.5, hourlyRate: 250, paperCost: 0.05, runTime: 1 });
  const [cv, setCV] = useState<CVInputs>({ width: 3, height: 1.5, materialCostM2: 45, finishingCost: 30 });

  const productionCost = useMemo(() => {
    if (activeTab === "digital") return calcDigital(digital);
    if (activeTab === "offset") return calcOffset(offset);
    return calcCV(cv);
  }, [activeTab, digital, offset, cv]);

  const financials = useMemo(() => calcFinancials(productionCost, markup), [productionCost, markup]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        tenant_id: activeTenantId, criado_por: user?.id,
        categoria: activeTab, cliente_nome: clientName || "Sem cliente",
        custo_producao: financials.productionCost, markup_percentual: markup,
        preco_venda: financials.salePrice, lucro_liquido: financials.netProfit,
        observacoes: notes, status: "rascunho",
      };
      if (activeTab === "digital") { payload.digital_quantidade = digital.quantity; payload.digital_custo_papel = digital.paperCost; payload.digital_custo_clique = digital.clickCost; payload.digital_tipo_clique = digital.clickType; payload.digital_lados = digital.sides; payload.digital_poses = digital.poses; }
      else if (activeTab === "offset") { payload.offset_tiragem = offset.runSize; payload.offset_custo_ctp = offset.ctpCost; payload.offset_tempo_setup = offset.setupTime; payload.offset_custo_hora = offset.hourlyRate; payload.offset_custo_papel = offset.paperCost; payload.offset_tempo_rodagem = offset.runTime; }
      else { payload.cv_largura = cv.width; payload.cv_altura = cv.height; payload.cv_custo_material_m2 = cv.materialCostM2; payload.cv_custo_acabamento = cv.finishingCost; }
      const { error } = await supabase.from("smart_quotes" as any).insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Orçamento salvo!"),
    onError: (e: any) => toast.error(e.message),
  });

  const numField = (label: string, value: number, onChange: (v: number) => void, step = 1) => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} step={step} min={0} className="mt-1" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Calculator className="h-6 w-6 text-primary" /><div><h1 className="text-xl font-bold">Orçamento Inteligente</h1><p className="text-sm text-muted-foreground">Calcule custos de produção por categoria</p></div></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card><CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs text-muted-foreground">Cliente</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome do cliente" className="mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Observações</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas rápidas..." className="mt-1" /></div>
            </div>
          </CardContent></Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="digital" className="gap-1.5"><Printer className="h-4 w-4" /> Digital</TabsTrigger>
              <TabsTrigger value="offset" className="gap-1.5"><Layers className="h-4 w-4" /> Offset</TabsTrigger>
              <TabsTrigger value="comunicacao_visual" className="gap-1.5"><Image className="h-4 w-4" /> Com. Visual</TabsTrigger>
            </TabsList>

            <TabsContent value="digital">
              <Card><CardHeader className="pb-3"><CardTitle className="text-base">Módulo Digital</CardTitle><p className="text-xs text-muted-foreground">((Papel + (Clique × Lados)) / Poses) × Quantidade</p></CardHeader>
              <CardContent><div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {numField("Quantidade", digital.quantity, v => setDigital(d => ({...d, quantity: v})))}
                {numField("Custo Papel (R$)", digital.paperCost, v => setDigital(d => ({...d, paperCost: v})), 0.01)}
                {numField("Custo Clique (R$)", digital.clickCost, v => setDigital(d => ({...d, clickCost: v})), 0.01)}
                <div><Label className="text-xs text-muted-foreground">Tipo</Label>
                  <Select value={digital.clickType} onValueChange={v => setDigital(d => ({...d, clickType: v as any}))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cmyk">CMYK</SelectItem><SelectItem value="pb">P&B</SelectItem></SelectContent></Select>
                </div>
                {numField("Lados", digital.sides, v => setDigital(d => ({...d, sides: v})), 1)}
                {numField("Poses", digital.poses, v => setDigital(d => ({...d, poses: v})), 1)}
              </div></CardContent></Card>
            </TabsContent>

            <TabsContent value="offset">
              <Card><CardHeader className="pb-3"><CardTitle className="text-base">Módulo Offset</CardTitle><p className="text-xs text-muted-foreground">CTP + (Setup × Hora) + (Papel × Tiragem) + (Rodagem × Hora)</p></CardHeader>
              <CardContent><div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {numField("Tiragem", offset.runSize, v => setOffset(o => ({...o, runSize: v})), 100)}
                {numField("Custo CTP (R$)", offset.ctpCost, v => setOffset(o => ({...o, ctpCost: v})))}
                {numField("Tempo Setup (h)", offset.setupTime, v => setOffset(o => ({...o, setupTime: v})), 0.5)}
                {numField("Custo/Hora (R$)", offset.hourlyRate, v => setOffset(o => ({...o, hourlyRate: v})))}
                {numField("Custo Papel (R$)", offset.paperCost, v => setOffset(o => ({...o, paperCost: v})), 0.01)}
                {numField("Tempo Rodagem (h)", offset.runTime, v => setOffset(o => ({...o, runTime: v})), 0.5)}
              </div></CardContent></Card>
            </TabsContent>

            <TabsContent value="comunicacao_visual">
              <Card><CardHeader className="pb-3"><CardTitle className="text-base">Comunicação Visual</CardTitle><p className="text-xs text-muted-foreground">(Largura × Altura × Custo/m²) + Acabamento</p></CardHeader>
              <CardContent><div className="grid grid-cols-2 gap-4">
                {numField("Largura (m)", cv.width, v => setCV(c => ({...c, width: v})), 0.1)}
                {numField("Altura (m)", cv.height, v => setCV(c => ({...c, height: v})), 0.1)}
                {numField("Custo Material/m² (R$)", cv.materialCostM2, v => setCV(c => ({...c, materialCostM2: v})))}
                {numField("Acabamento (R$)", cv.finishingCost, v => setCV(c => ({...c, finishingCost: v})))}
              </div></CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">Markup</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Slider value={[markup]} onValueChange={([v]) => setMarkup(v)} min={0} max={200} step={5} />
            <p className="text-center text-2xl font-bold text-primary">{markup}%</p>
          </CardContent></Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 space-y-4">
              <div><p className="text-xs text-muted-foreground">Custo de Produção</p><p className="text-xl font-bold">{formatBRL(financials.productionCost)}</p></div>
              <Separator />
              <div><p className="text-xs text-muted-foreground">Preço de Venda</p><p className="text-2xl font-bold text-primary">{formatBRL(financials.salePrice)}</p></div>
              <Separator />
              <div><p className="text-xs text-muted-foreground">Lucro Estimado</p><p className="text-xl font-bold text-green-600">{formatBRL(financials.netProfit)}</p></div>
              {activeTab === "comunicacao_visual" && cv.width > 0 && cv.height > 0 && (
                <div className="pt-2"><Badge variant="outline">Área: {(cv.width * cv.height).toFixed(2)} m²</Badge></div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button className="flex-1 gap-1.5" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save className="h-4 w-4" /> Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
