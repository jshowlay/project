export type Category = {
  id: string;
  label: string;
  emoji?: string;
  // Operator-style query (works with your existing parser /api/trends)
  // Keep these simple; you can edit freely later.
  query: string;
};

export const CATEGORIES: Category[] = [
  {
    id: 'ai',
    label: 'AI',
    emoji: '🤖',
    query: 'tag:ai OR "ai agents" sort:score since:7d'
  },
  {
    id: 'crypto',
    label: 'Crypto',
    emoji: '🪙',
    query: 'tag:crypto source:coingecko since:7d sort:score'
  },
  {
    id: 'stocks',
    label: 'Stocks',
    emoji: '📈',
    query: 'source:alphavantage score:>50 sort:score since:7d'
  },
  {
    id: 'consumer',
    label: 'Consumer Tech',
    emoji: '📱',
    query: 'tag:consumer OR "product launch" sort:recency since:14d'
  },
  {
    id: 'startups',
    label: 'Startups',
    emoji: '🚀',
    query: 'tag:startups OR founder stories sort:recency since:30d'
  },
  {
    id: 'gaming',
    label: 'Gaming',
    emoji: '🎮',
    query: 'tag:gaming OR "game update" sort:recency since:14d'
  }
];

export function getCategory(id?: string | null): Category | undefined {
  if (!id) return undefined;
  return CATEGORIES.find(c => c.id === id);
}
