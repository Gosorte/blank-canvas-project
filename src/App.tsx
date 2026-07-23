import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AcessoPendente from "./pages/auth/AcessoPendente";
import { AdminLayout } from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Tenants from "./pages/admin/Tenants";
import Planos from "./pages/admin/Planos";
import Metricas from "./pages/admin/Metricas";
import Precificacao from "./pages/admin/Precificacao";
import LGPD from "./pages/admin/LGPD";
import Configuracoes from "./pages/admin/Configuracoes";
import Clientes from "./pages/admin/Clientes";
import Fornecedores from "./pages/admin/Fornecedores";
import Estoque from "./pages/admin/Estoque";
import OrdensProducao from "./pages/admin/OrdensProducao";
import Financeiro from "./pages/admin/Financeiro";
import CRM from "./pages/admin/CRM";
import CrmConversas from "./pages/admin/CrmConversas";
import CrmTemplatesPage from "./pages/admin/CrmTemplates";
import CrmContatosPage from "./pages/admin/CrmContatos";
import PedidosLoja from "./pages/admin/PedidosLoja";
import DashboardERP from "./pages/admin/DashboardERP";
import DashboardCRM from "./pages/admin/DashboardCRM";
import DashboardEcommerce from "./pages/admin/DashboardEcommerce";
import LojaLayout from "./pages/loja/LojaLayout";
import Catalogo from "./pages/loja/Catalogo";
import ProdutoDetalhe from "./pages/loja/ProdutoDetalhe";
import Carrinho from "./pages/loja/Carrinho";
import RastrearPedido from "./pages/loja/RastrearPedido";
import LojaLogin from "./pages/loja/LojaLogin";
import LojaCadastro from "./pages/loja/LojaCadastro";
import MinhaConta from "./pages/loja/MinhaConta";
// Production modules
import DigitalInsumos from "./pages/admin/producao/DigitalInsumos";
import DigitalMaquinas from "./pages/admin/producao/DigitalMaquinas";
import DigitalProcessos from "./pages/admin/producao/DigitalProcessos";
import DigitalMateriais from "./pages/admin/producao/DigitalMateriais";
import DigitalProdutos from "./pages/admin/producao/DigitalProdutos";
import OffsetInsumos from "./pages/admin/producao/OffsetInsumos";
import OffsetMaquinas from "./pages/admin/producao/OffsetMaquinas";
import OffsetProcessos from "./pages/admin/producao/OffsetProcessos";
import OffsetMateriais from "./pages/admin/producao/OffsetMateriais";
import OffsetProdutos from "./pages/admin/producao/OffsetProdutos";
import VisualInsumos from "./pages/admin/producao/VisualInsumos";
import VisualMaquinas from "./pages/admin/producao/VisualMaquinas";
import VisualProcessos from "./pages/admin/producao/VisualProcessos";
import VisualMateriais from "./pages/admin/producao/VisualMateriais";
import VisualProdutos from "./pages/admin/producao/VisualProdutos";
// Vendas modules
import Orcamentos from "./pages/admin/vendas/Orcamentos";
import Pedidos from "./pages/admin/vendas/Pedidos";
import PCP from "./pages/admin/vendas/PCP";
import PDV from "./pages/admin/vendas/PDV";
import OrcamentoInteligente from "./pages/admin/vendas/OrcamentoInteligente";
import ProdutosSimples from "./pages/admin/vendas/ProdutosSimples";
import AgendaTarefas from "./pages/admin/vendas/AgendaTarefas";
// Financeiro modules
import ContasPagar from "./pages/admin/financeiro/ContasPagar";
import ContasReceber from "./pages/admin/financeiro/ContasReceber";
import FluxoCaixa from "./pages/admin/financeiro/FluxoCaixa";
import FormasPagamento from "./pages/admin/financeiro/FormasPagamento";
import RelatoriosGerenciais from "./pages/admin/RelatoriosGerenciais";
import Transportadoras from "./pages/admin/Transportadoras";
import VendedoresPage from "./pages/admin/Vendedores";
import ClienteDetalhe from "./pages/admin/ClienteDetalhe";
import CreditDashboard from "./pages/admin/CreditDashboard";
const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/acesso-pendente" element={<AcessoPendente />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="precificacao" element={<Precificacao />} />
              <Route path="planos" element={<Planos />} />
              <Route path="metricas" element={<Metricas />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="fornecedores" element={<Fornecedores />} />
              <Route path="estoque" element={<Estoque />} />
              <Route path="ordens" element={<OrdensProducao />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="crm" element={<CRM />} />
              <Route path="crm-conversas" element={<CrmConversas />} />
              <Route path="crm-templates" element={<CrmTemplatesPage />} />
              <Route path="crm-contatos" element={<CrmContatosPage />} />
              <Route path="dashboard-erp" element={<DashboardERP />} />
              <Route path="dashboard-erp/analises" element={<DashboardERP />} />
              <Route path="dashboard-erp/indicadores" element={<DashboardERP />} />
              <Route path="dashboard-crm" element={<DashboardCRM />} />
              <Route path="dashboard-ecommerce" element={<DashboardEcommerce />} />
              <Route path="pedidos-loja" element={<PedidosLoja />} />
              <Route path="lgpd" element={<LGPD />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="configuracoes/dashboard-admin" element={<Configuracoes />} />
              <Route path="configuracoes/geral" element={<Configuracoes />} />
              <Route path="configuracoes/aparencia" element={<Configuracoes />} />
              <Route path="configuracoes/auditoria" element={<Configuracoes />} />
              <Route path="configuracoes/notificacoes" element={<Configuracoes />} />
              <Route path="ajuda/central" element={<Configuracoes />} />
              <Route path="ajuda/tutoriais" element={<Configuracoes />} />
              <Route path="ajuda/suporte" element={<Configuracoes />} />
              <Route path="ajuda/sobre" element={<Configuracoes />} />
              {/* Digital */}
              <Route path="digital/insumos" element={<DigitalInsumos />} />
              <Route path="digital/maquinas" element={<DigitalMaquinas />} />
              <Route path="digital/processos" element={<DigitalProcessos />} />
              <Route path="digital/materiais" element={<DigitalMateriais />} />
              <Route path="digital/papeis" element={<DigitalMateriais />} />
              <Route path="digital/produtos" element={<DigitalProdutos />} />
              {/* Offset */}
              <Route path="offset/insumos" element={<OffsetInsumos />} />
              <Route path="offset/maquinas" element={<OffsetMaquinas />} />
              <Route path="offset/processos" element={<OffsetProcessos />} />
              <Route path="offset/materiais" element={<OffsetMateriais />} />
              <Route path="offset/papeis" element={<OffsetMateriais />} />
              <Route path="offset/produtos" element={<OffsetProdutos />} />
              {/* Visual */}
              <Route path="visual/insumos" element={<VisualInsumos />} />
              <Route path="visual/maquinas" element={<VisualMaquinas />} />
              <Route path="visual/processos" element={<VisualProcessos />} />
              <Route path="visual/materiais" element={<VisualMateriais />} />
              <Route path="visual/papeis" element={<VisualMateriais />} />
              <Route path="visual/mao-de-obra" element={<VisualProcessos />} />
              <Route path="visual/produtos" element={<VisualProdutos />} />
              {/* Vendas */}
              <Route path="orcamentos-erp" element={<Orcamentos />} />
              <Route path="pedidos-erp" element={<Pedidos />} />
              <Route path="pcp" element={<PCP />} />
              <Route path="pdv" element={<PDV />} />
              <Route path="orcamento-inteligente" element={<OrcamentoInteligente />} />
              <Route path="produtos-simples" element={<ProdutosSimples />} />
              <Route path="agenda-tarefas" element={<AgendaTarefas />} />
              {/* Financeiro (estrutura Micromaq) */}
              <Route path="financeiro/contas-pagar" element={<ContasPagar />} />
              <Route path="financeiro/contas-receber" element={<ContasReceber />} />
              <Route path="financeiro/fluxo-caixa" element={<FluxoCaixa />} />
              <Route path="financeiro/formas-pagamento" element={<FormasPagamento />} />
              <Route path="financeiro/relatorios" element={<Financeiro />} />
              <Route path="financeiro/notas-fiscais" element={<Financeiro />} />
              <Route path="financeiro/gestao" element={<Financeiro />} />
              {/* Estoque (estrutura Micromaq) */}
              <Route path="estoque/produtos" element={<Estoque />} />
              <Route path="estoque/movimentacoes" element={<Estoque />} />
              <Route path="estoque/inventario" element={<Estoque />} />
              <Route path="estoque/fornecedores" element={<Fornecedores />} />
              {/* Cadastros e relatórios (estrutura Micromaq) */}
              <Route path="cadastros/clientes" element={<Clientes />} />
              <Route path="cadastros/clientes/:id" element={<ClienteDetalhe />} />
              <Route path="cadastros/produtos" element={<ProdutosSimples />} />
              <Route path="cadastros/servicos" element={<Precificacao />} />
              <Route path="cadastros/creditos" element={<CreditDashboard />} />
              <Route path="transportadoras" element={<Transportadoras />} />
              <Route path="vendedores" element={<VendedoresPage />} />
              <Route path="relatorios" element={<RelatoriosGerenciais />} />
              <Route path="relatorios/vendas" element={<RelatoriosGerenciais />} />
              <Route path="relatorios/financeiro" element={<RelatoriosGerenciais />} />
              <Route path="relatorios/producao" element={<RelatoriosGerenciais />} />
              <Route path="relatorios/estoque" element={<RelatoriosGerenciais />} />
            </Route>
            {/* Loja Virtual Pública */}
            <Route path="/loja/:tenantId" element={<LojaLayout />}>
              <Route index element={<Catalogo />} />
              <Route path="produto/:produtoId" element={<ProdutoDetalhe />} />
              <Route path="carrinho" element={<Carrinho />} />
              <Route path="rastrear" element={<RastrearPedido />} />
              <Route path="login" element={<LojaLogin />} />
              <Route path="cadastro" element={<LojaCadastro />} />
              <Route path="conta" element={<MinhaConta />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
