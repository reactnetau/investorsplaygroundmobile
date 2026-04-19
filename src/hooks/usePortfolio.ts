import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Portfolio, Holding, HoldingWithPnL, PortfolioStats } from '../types';

const client = generateClient();

async function hasSignedInUser() {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export function usePortfolios() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!(await hasSignedInUser())) {
        setPortfolios([]);
        return;
      }

      const result = await (client.models as any).Portfolio.list();
      const items: Portfolio[] = (result.data ?? []).sort(
        (a: Portfolio, b: Portfolio) =>
          new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      );
      setPortfolios(items);
    } catch (err) {
      console.error('[usePortfolios]', err);
      setError('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPortfolios();
  }, [fetchPortfolios]);

  const renamePortfolio = useCallback(async (id: string, name: string) => {
    await (client.models as any).Portfolio.update({ id, name });
    await fetchPortfolios();
  }, [fetchPortfolios]);

  return { portfolios, loading, error, fetchPortfolios, renamePortfolio };
}

export function useHoldings(portfolioId: string | null) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = useCallback(async () => {
    if (!portfolioId) {
      setHoldings([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (!(await hasSignedInUser())) {
        setHoldings([]);
        return;
      }

      const result = await (client.models as any).Holding.list({
        filter: { portfolioId: { eq: portfolioId } },
      });
      setHoldings(result.data ?? []);
    } catch (err) {
      console.error('[useHoldings]', err);
      setError('Failed to load holdings');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    void fetchHoldings();
  }, [fetchHoldings]);

  return { holdings, loading, error, fetchHoldings };
}

/** Compute P&L and stats from a portfolio + its holdings. */
export function computeHoldingsWithPnL(holdings: Holding[]): HoldingWithPnL[] {
  return holdings.map((h) => {
    const currentPrice = h.currentPrice ?? h.buyPrice;
    const currentValue = currentPrice * h.quantity;
    const cost = h.buyPrice * h.quantity;
    const gainLoss = currentValue - cost;
    const gainLossPct = cost > 0 ? (gainLoss / cost) * 100 : 0;
    const purchasedMs = new Date(h.purchasedOn).getTime();
    const daysHeld = Math.max(0, Math.floor((Date.now() - purchasedMs) / 86400000));
    return { ...h, currentValue, cost, gainLoss, gainLossPct, daysHeld };
  });
}

export function computePortfolioStats(portfolio: Portfolio, holdings: HoldingWithPnL[]): PortfolioStats {
  const holdingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalValue = portfolio.cash + holdingsValue;
  const totalCost = holdings.reduce((sum, h) => sum + h.cost, 0);
  const gainLoss = holdings.reduce((sum, h) => sum + h.gainLoss, 0);
  const gainLossPct = portfolio.startingCash > 0 ? ((totalValue - portfolio.startingCash) / portfolio.startingCash) * 100 : 0;
  return {
    totalValue,
    holdingsValue,
    cash: portfolio.cash,
    gainLoss,
    gainLossPct,
    holdingCount: holdings.length,
  };
}
