import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface TrendSignal {
  velocity: number;
  acceleration: number;
  convergence: number;
  searchIntent: number;
  creatorIndex: number;
  engagementEfficiency: number;
  geoSpread: number;
}

interface TrendData {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: string;
  publishedAt: string;
  score: number;
  trendScore: number;
  signals: TrendSignal;
  sparkline: number[];
  classification: 'emerging' | 'breaking' | 'cooling' | 'spiky';
  saved: boolean;
  alerted: boolean;
}

interface TrendsResponse {
  trends: TrendData[];
  kpis: {
    topMovers: number;
    breakouts: number;
    converging: number;
    highIntent: number;
  };
  lastUpdated: string;
}

// Generate realistic sparkline data
function generateSparkline(baseValue: number, volatility: number = 0.3): number[] {
  const points = 60;
  const sparkline: number[] = [];
  let currentValue = baseValue;
  
  for (let i = 0; i < points; i++) {
    // Add some randomness and trend
    const change = (Math.random() - 0.5) * volatility * baseValue;
    const trend = Math.sin(i / 10) * baseValue * 0.1; // Subtle trend
    currentValue = Math.max(0, currentValue + change + trend);
    sparkline.push(Math.round(currentValue));
  }
  
  return sparkline;
}

// Generate mock trends data
function generateMockTrends(): TrendData[] {
  const mockTrends = [
    {
      id: '1',
      title: 'Sleepy Girl Mocktail',
      description: 'The viral TikTok drink trend that combines melatonin, magnesium, and tart cherry juice for better sleep',
      url: 'https://example.com/sleepy-girl-mocktail',
      source: 'tiktok',
      category: 'lifestyle',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      score: 95,
      trendScore: 87,
      signals: {
        velocity: 92,
        acceleration: 88,
        convergence: 85,
        searchIntent: 90,
        creatorIndex: 78,
        engagementEfficiency: 82,
        geoSpread: 75
      },
      sparkline: generateSparkline(85, 0.4),
      classification: 'breaking' as const,
      saved: false,
      alerted: false
    },
    {
      id: '2',
      title: 'AI Tattoo Filters',
      description: 'AI-powered filters that show how tattoos would look on your body using augmented reality',
      url: 'https://example.com/ai-tattoo-filters',
      source: 'instagram',
      category: 'technology',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      score: 88,
      trendScore: 79,
      signals: {
        velocity: 85,
        acceleration: 92,
        convergence: 78,
        searchIntent: 88,
        creatorIndex: 82,
        engagementEfficiency: 85,
        geoSpread: 70
      },
      sparkline: generateSparkline(80, 0.5),
      classification: 'emerging' as const,
      saved: true,
      alerted: false
    },
    {
      id: '3',
      title: 'Quiet Luxury Fashion',
      description: 'The understated, high-quality fashion trend emphasizing subtle elegance over flashy logos',
      url: 'https://example.com/quiet-luxury-fashion',
      source: 'youtube',
      category: 'fashion',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      score: 82,
      trendScore: 74,
      signals: {
        velocity: 78,
        acceleration: 75,
        convergence: 82,
        searchIntent: 85,
        creatorIndex: 88,
        engagementEfficiency: 78,
        geoSpread: 85
      },
      sparkline: generateSparkline(75, 0.3),
      classification: 'converging' as const,
      saved: false,
      alerted: true
    },
    {
      id: '4',
      title: 'Micro-Workouts',
      description: 'Short, intense 5-10 minute workout sessions that fit into busy schedules',
      url: 'https://example.com/micro-workouts',
      source: 'reddit',
      category: 'health',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      score: 79,
      trendScore: 72,
      signals: {
        velocity: 75,
        acceleration: 68,
        convergence: 70,
        searchIntent: 82,
        creatorIndex: 75,
        engagementEfficiency: 80,
        geoSpread: 78
      },
      sparkline: generateSparkline(70, 0.4),
      classification: 'cooling' as const,
      saved: false,
      alerted: false
    },
    {
      id: '5',
      title: 'Digital Detox Retreats',
      description: 'Luxury retreats focused on disconnecting from technology and reconnecting with nature',
      url: 'https://example.com/digital-detox-retreats',
      source: 'twitter',
      category: 'lifestyle',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      score: 76,
      trendScore: 69,
      signals: {
        velocity: 72,
        acceleration: 85,
        convergence: 68,
        searchIntent: 75,
        creatorIndex: 82,
        engagementEfficiency: 78,
        geoSpread: 65
      },
      sparkline: generateSparkline(68, 0.6),
      classification: 'spiky' as const,
      saved: true,
      alerted: false
    },
    {
      id: '6',
      title: 'Plant-Based Protein Powders',
      description: 'Innovative protein powders made from peas, hemp, and other plant sources gaining popularity',
      url: 'https://example.com/plant-based-protein',
      source: 'instagram',
      category: 'health',
      publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      score: 74,
      trendScore: 67,
      signals: {
        velocity: 70,
        acceleration: 65,
        convergence: 75,
        searchIntent: 78,
        creatorIndex: 72,
        engagementEfficiency: 75,
        geoSpread: 80
      },
      sparkline: generateSparkline(65, 0.3),
      classification: 'converging' as const,
      saved: false,
      alerted: false
    },
    {
      id: '7',
      title: 'Smart Home Energy Management',
      description: 'AI-powered systems that optimize home energy usage and reduce utility bills',
      url: 'https://example.com/smart-home-energy',
      source: 'youtube',
      category: 'technology',
      publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      score: 71,
      trendScore: 64,
      signals: {
        velocity: 68,
        acceleration: 72,
        convergence: 65,
        searchIntent: 70,
        creatorIndex: 78,
        engagementEfficiency: 72,
        geoSpread: 68
      },
      sparkline: generateSparkline(62, 0.4),
      classification: 'emerging' as const,
      saved: false,
      alerted: false
    },
    {
      id: '8',
      title: 'Mindful Gaming',
      description: 'Video games designed to promote mental health, mindfulness, and stress relief',
      url: 'https://example.com/mindful-gaming',
      source: 'reddit',
      category: 'gaming',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      score: 68,
      trendScore: 61,
      signals: {
        velocity: 65,
        acceleration: 58,
        convergence: 62,
        searchIntent: 68,
        creatorIndex: 75,
        engagementEfficiency: 70,
        geoSpread: 72
      },
      sparkline: generateSparkline(58, 0.5),
      classification: 'cooling' as const,
      saved: false,
      alerted: false
    }
  ];

  return mockTrends;
}

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const trends = generateMockTrends();
    
    // Calculate KPIs
    const kpis = {
      topMovers: trends.filter(t => t.signals.velocity > 80).length,
      breakouts: trends.filter(t => t.classification === 'breaking').length,
      converging: trends.filter(t => t.classification === 'converging').length,
      highIntent: trends.filter(t => t.signals.searchIntent > 80).length
    };

    const response: TrendsResponse = {
      trends,
      kpis,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching trends:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch trends data',
      trends: [],
      kpis: { topMovers: 0, breakouts: 0, converging: 0, highIntent: 0 },
      lastUpdated: new Date().toISOString()
    }, { status: 500 });
  }
}
