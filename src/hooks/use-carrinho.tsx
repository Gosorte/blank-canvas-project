import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CarrinhoItem {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  especificacoes: Record<string, string>;
  valorUnitario: number;
  valorTotal: number;
  arquivoUrl?: string;
}

interface CarrinhoContextType {
  itens: CarrinhoItem[];
  addItem: (item: CarrinhoItem) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CarrinhoContext = createContext<CarrinhoContextType | undefined>(undefined);

function getStorageKey(tenantId: string) {
  return `carrinho_${tenantId}`;
}

export function CarrinhoProvider({ tenantId, children }: { tenantId: string; children: ReactNode }) {
  const [itens, setItens] = useState<CarrinhoItem[]>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(tenantId));
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(getStorageKey(tenantId), JSON.stringify(itens));
  }, [itens, tenantId]);

  const addItem = (item: CarrinhoItem) => setItens(prev => [...prev, item]);
  const removeItem = (index: number) => setItens(prev => prev.filter((_, i) => i !== index));
  const clearCart = () => setItens([]);
  const total = itens.reduce((s, i) => s + i.valorTotal, 0);
  const count = itens.length;

  return (
    <CarrinhoContext.Provider value={{ itens, addItem, removeItem, clearCart, total, count }}>
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error("useCarrinho must be inside CarrinhoProvider");
  return ctx;
}
