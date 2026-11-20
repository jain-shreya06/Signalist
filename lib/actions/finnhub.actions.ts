'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { fetchFinnhubJSON, FinnhubApiError } from '@/lib/finnhub/client';
import { cache } from 'react';

function getFinnhubToken(): string {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) throw new Error('FINNHUB_API_KEY is not configured.');
  return token;
}

export async function isSupportedStockSymbol(symbol: string): Promise<boolean> {
  try {
    const token = getFinnhubToken();
    const profile = await fetchFinnhubJSON<{ name?: string; ticker?: string }>(
      'stock/profile2',
      { symbol },
      token,
    );
    return typeof profile.name === 'string' && profile.name.trim().length > 0;
  } catch {
    throw new Error('Stock symbol verification is temporarily unavailable.');
  }
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const token = getFinnhubToken();
    const range = getDateRange(5);
    const cleanSymbols = (symbols || [])
      .map((symbol) => symbol?.trim().toUpperCase())
      .filter((symbol): symbol is string => Boolean(symbol));
    const maxArticles = 6;

    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};
      await Promise.all(cleanSymbols.map(async (symbol) => {
        try {
          const articles = await fetchFinnhubJSON<RawNewsArticle[]>(
            'company-news',
            { symbol, from: range.from, to: range.to },
            token,
            300,
          );
          perSymbolArticles[symbol] = (articles || []).filter(validateArticle);
        } catch (error) {
          logFinnhubFailure('company news', error);
          perSymbolArticles[symbol] = [];
        }
      }));

      const collected: MarketNewsArticle[] = [];
      for (let round = 0; round < maxArticles; round++) {
        for (const symbol of cleanSymbols) {
          const article = perSymbolArticles[symbol]?.shift();
          if (article && validateArticle(article)) collected.push(formatArticle(article, true, symbol, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
    }

    const general = await fetchFinnhubJSON<RawNewsArticle[]>(
      'news',
      { category: 'general' },
      token,
      300,
    );
    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const article of general || []) {
      if (!validateArticle(article)) continue;
      const key = `${article.id}-${article.url}-${article.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(article);
      if (unique.length >= 20) break;
    }

    return unique.slice(0, maxArticles).map((article, index) => formatArticle(article, false, undefined, index));
  } catch (error) {
    logFinnhubFailure('news', error);
    throw new Error('Failed to fetch market news.');
  }
}

type FinnhubProfile = {
  name?: string;
  ticker?: string;
  exchange?: string;
};

function logFinnhubFailure(operation: string, error: unknown) {
  if (error instanceof FinnhubApiError) {
    console.error(`Finnhub ${operation} failed (HTTP ${error.status}).`);
  } else {
    console.error(`Finnhub ${operation} failed.`);
  }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  const token = getFinnhubToken();
  const trimmed = typeof query === 'string' ? query.trim() : '';
  if (trimmed.length > 80) throw new Error('Search query is too long.');

  try {
    let results: FinnhubSearchResult[] = [];
    if (!trimmed) {
      const profiles = await Promise.all(POPULAR_STOCK_SYMBOLS.slice(0, 10).map(async (symbol) => {
        const profile = await fetchFinnhubJSON<FinnhubProfile>(
          'stock/profile2',
          { symbol },
          token,
          3600,
        );
        return { symbol, profile };
      }));

      results = profiles.flatMap(({ symbol, profile }) => {
        const name = profile.name || profile.ticker;
        if (!name) return [];
        return [{
          symbol: symbol.toUpperCase(),
          description: name,
          displaySymbol: symbol.toUpperCase(),
          exchange: profile.exchange,
          type: 'Common Stock',
        }];
      });
    } else {
      const data = await fetchFinnhubJSON<FinnhubSearchResponse>(
        'search',
        { q: trimmed },
        token,
        1800,
      );
      results = Array.isArray(data?.result) ? data.result : [];
    }

    return results
      .filter((result) => typeof result.type === 'string' && result.type.toLowerCase().includes('stock'))
      .map((result) => {
        const symbol = (result.symbol || '').toUpperCase();
        return {
          symbol,
          name: result.description || symbol,
          exchange: result.exchange || 'US',
          type: result.type || 'Stock',
          isInWatchlist: false,
        };
      })
      .slice(0, 15);
  } catch (error) {
    logFinnhubFailure('stock search', error);
    throw new Error('Stock search is temporarily unavailable.');
  }
});
