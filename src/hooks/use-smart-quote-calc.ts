export interface DigitalInputs {
  quantity: number;
  paperCost: number;
  clickCost: number;
  clickType: "cmyk" | "pb";
  sides: number;
  poses: number;
}

export interface OffsetInputs {
  runSize: number;
  ctpCost: number;
  setupTime: number;
  hourlyRate: number;
  paperCost: number;
  runTime: number;
}

export interface CVInputs {
  width: number;
  height: number;
  materialCostM2: number;
  finishingCost: number;
}

export function calcDigital(i: DigitalInputs): number {
  if (!i.poses || !i.quantity) return 0;
  return ((i.paperCost + (i.clickCost * i.sides)) / i.poses) * i.quantity;
}

export function calcOffset(i: OffsetInputs): number {
  if (!i.runSize) return 0;
  return i.ctpCost + (i.setupTime * i.hourlyRate) + (i.paperCost * i.runSize) + (i.runTime * i.hourlyRate);
}

export function calcCV(i: CVInputs): number {
  const area = i.width * i.height;
  return (area * i.materialCostM2) + i.finishingCost;
}

export function calcFinancials(productionCost: number, markupPercent: number) {
  const salePrice = productionCost * (1 + markupPercent / 100);
  const netProfit = salePrice - productionCost;
  return { productionCost, salePrice, netProfit };
}
