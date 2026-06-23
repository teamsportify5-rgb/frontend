import type { Inventory } from '@/services/inventory.service'

export type StockAlertStatus = 'critical' | 'low'

export function getStockAlertStatus(quantity: number, threshold: number): StockAlertStatus {
  if (quantity <= 0) return 'critical'
  if (threshold > 0 && quantity <= threshold * 0.3) return 'critical'
  return 'low'
}

export function mapInventoryToStockAlert(item: Inventory) {
  return {
    id: item.id,
    item: item.item,
    current: item.quantity,
    threshold: item.threshold,
    unit: item.unit,
    status: getStockAlertStatus(item.quantity, item.threshold),
  }
}

export function groupPayrollByMonth(
  records: { month: string; basic_salary: number; deductions: number; net_pay: number }[]
) {
  const byMonth = new Map<string, { total: number; deductions: number; net: number }>()
  for (const record of records) {
    const existing = byMonth.get(record.month) ?? { total: 0, deductions: 0, net: 0 }
    existing.total += record.basic_salary
    existing.deductions += record.deductions
    existing.net += record.net_pay
    byMonth.set(record.month, existing)
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, values]) => ({
      month,
      total: Math.round(values.total),
      deductions: Math.round(values.deductions),
      net: Math.round(values.net),
    }))
}

export function groupOrdersByMonth(orders: { created_at: string }[]) {
  const byMonth = new Map<string, number>()
  for (const order of orders) {
    const key = order.created_at.slice(0, 7)
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1)
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, orders: count }))
}
