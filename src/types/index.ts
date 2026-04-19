// ── Domain types ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  owner?: string;
  email: string;
  subscriptionStatus: 'active' | 'inactive';
  subscriptionEndDate?: string;
  subscriptionProvider?: string;
  subscriptionProductId?: string;
  revenueCatAppUserId?: string;
  currency: string;
  activePortfolioId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Portfolio {
  id: string;
  owner?: string;
  name: string;
  cash: number;
  startingCash: number;
  currency: string;
  currentDay?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Holding {
  id: string;
  owner?: string;
  portfolioId: string;
  code: string;
  buyPrice: number;
  quantity: number;
  currentPrice?: number;
  priceCurrency: string;
  purchasedOn: string;
  volatility?: number;
  momentumBias?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ── Computed types ────────────────────────────────────────────────────────────

export interface HoldingWithPnL extends Holding {
  currentValue: number;
  cost: number;
  gainLoss: number;
  gainLossPct: number;
  daysHeld: number;
}

export interface PortfolioStats {
  totalValue: number;       // cash + holdings value
  holdingsValue: number;    // value of all positions
  cash: number;
  gainLoss: number;         // unrealised gain/loss
  gainLossPct: number;      // gain/loss as % of starting cash
  holdingCount: number;
}
