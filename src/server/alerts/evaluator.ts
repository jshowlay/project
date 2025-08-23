import { PrismaClient } from '@prisma/client';
import { neon } from '@neondatabase/serverless';

const prisma = new PrismaClient();
const sql = neon(process.env.DATABASE_URL!);

interface AlertEvaluationResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  trends: any[];
  message: string;
  metadata: any;
}

interface WebhookPayload {
  rule_id: string;
  rule_name: string;
  triggered_at: string;
  trends: any[];
  message: string;
  metadata: any;
}

export class AlertEvaluator {
  private lockId = 12345; // Advisory lock ID for this evaluator

  async evaluateAllRules(): Promise<AlertEvaluationResult[]> {
    // Use advisory lock to prevent concurrent evaluation
    const lockResult = await sql`SELECT pg_try_advisory_lock(${this.lockId})`;
    const lockAcquired = lockResult[0]?.pg_try_advisory_lock;

    if (!lockAcquired) {
      console.log('Alert evaluation already in progress, skipping...');
      return [];
    }

    try {
      const activeRules = await prisma.alertRule.findMany({
        where: { isActive: true },
        include: { deliveries: true }
      });

      const results: AlertEvaluationResult[] = [];

      for (const rule of activeRules) {
        try {
          const result = await this.evaluateRule(rule);
          results.push(result);
        } catch (error) {
          console.error(`Error evaluating rule ${rule.id}:`, error);
          results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            triggered: false,
            trends: [],
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            metadata: { error: true }
          });
        }
      }

      return results;
    } finally {
      // Always release the advisory lock
      await sql`SELECT pg_advisory_unlock(${this.lockId})`;
    }
  }

  private async evaluateRule(rule: any): Promise<AlertEvaluationResult> {
    // Check cooldown - don't trigger if we've sent recently
    const recentDelivery = await prisma.alertDelivery.findFirst({
      where: {
        ruleId: rule.id,
        status: 'SENT',
        createdAt: {
          gte: new Date(Date.now() - rule.cooldownMinutes * 60 * 1000)
        }
      }
    });

    if (recentDelivery) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        triggered: false,
        trends: [],
        message: `Rule in cooldown (${rule.cooldownMinutes} minutes)`,
        metadata: { cooldown: true }
      };
    }

    // Build the evaluation query
    const trends = await this.getTrendsForRule(rule);
    
    if (trends.length === 0) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        triggered: false,
        trends: [],
        message: 'No trends found matching criteria',
        metadata: { noTrends: true }
      };
    }

    // Check if any trends meet the thresholds
    const triggeredTrends = trends.filter(trend => {
      if (rule.minScore && trend.score < rule.minScore) return false;
      if (rule.maxScore && trend.score > rule.maxScore) return false;
      if (rule.minVelocity && trend.velocity < rule.minVelocity) return false;
      if (rule.maxVelocity && trend.velocity > rule.maxVelocity) return false;
      if (rule.minAcceleration && trend.acceleration < rule.minAcceleration) return false;
      if (rule.maxAcceleration && trend.acceleration > rule.maxAcceleration) return false;
      return true;
    });

    if (triggeredTrends.length === 0) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        triggered: false,
        trends: trends.slice(0, 5), // Return top 5 for context
        message: 'Trends found but none meet thresholds',
        metadata: { thresholdsNotMet: true }
      };
    }

    // Rule triggered! Create delivery records
    await this.createDeliveries(rule, triggeredTrends);

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      triggered: true,
      trends: triggeredTrends,
      message: `Alert triggered: ${triggeredTrends.length} trends meet criteria`,
      metadata: {
        triggeredCount: triggeredTrends.length,
        thresholds: {
          minScore: rule.minScore,
          maxScore: rule.maxScore,
          minVelocity: rule.minVelocity,
          maxVelocity: rule.maxVelocity,
          minAcceleration: rule.minAcceleration,
          maxAcceleration: rule.maxAcceleration
        }
      }
    };
  }

  private async getTrendsForRule(rule: any): Promise<any[]> {
    const timeWindowMinutes = rule.timeWindowMinutes || 15;
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    // Build dynamic query based on rule filters
    let query = `
      WITH recent_trends AS (
        SELECT 
          tr.source,
          tr.topic,
          tr.score,
          tr.region,
          tr.tags,
          tr.observedAt,
          tr.url,
          tr.imageUrl,
          -- Calculate velocity (score change over time)
          (tr.score - LAG(tr.score, 1) OVER (PARTITION BY tr.source, tr.topic ORDER BY tr.observedAt)) / 
          EXTRACT(EPOCH FROM (tr.observedAt - LAG(tr.observedAt, 1) OVER (PARTITION BY tr.source, tr.topic ORDER BY tr.observedAt))) * 3600 as velocity,
          -- Calculate acceleration (velocity change over time)
          (tr.score - 2 * LAG(tr.score, 1) OVER (PARTITION BY tr.source, tr.topic ORDER BY tr.observedAt) + 
           LAG(tr.score, 2) OVER (PARTITION BY tr.source, tr.topic ORDER BY tr.observedAt)) / 
          POWER(EXTRACT(EPOCH FROM (tr.observedAt - LAG(tr.observedAt, 2) OVER (PARTITION BY tr.source, tr.topic ORDER BY tr.observedAt))) / 3600, 2) as acceleration
        FROM "TrendRecord" tr
        WHERE tr.observedAt >= ${cutoffTime.toISOString()}
    `;

    const conditions: string[] = [];

    if (rule.sources && rule.sources.length > 0) {
      conditions.push(`tr.source = ANY(${JSON.stringify(rule.sources)})`);
    }

    if (rule.regions && rule.regions.length > 0) {
      conditions.push(`tr.region = ANY(${JSON.stringify(rule.regions)})`);
    }

    if (rule.keywords && rule.keywords.length > 0) {
      const keywordConditions = rule.keywords.map((keyword: string) => 
        `(tr.topic ILIKE '%${keyword}%' OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(tr.tags) tag WHERE tag ILIKE '%${keyword}%'))`
      );
      conditions.push(`(${keywordConditions.join(' OR ')})`);
    }

    if (rule.tags && rule.tags.length > 0) {
      const tagConditions = rule.tags.map((tag: string) => 
        `EXISTS (SELECT 1 FROM jsonb_array_elements_text(tr.tags) t WHERE t ILIKE '%${tag}%')`
      );
      conditions.push(`(${tagConditions.join(' OR ')})`);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += `
      ),
      baseline_trends AS (
        SELECT 
          source,
          topic,
          AVG(score) as baseline_score,
          AVG(velocity) as baseline_velocity
        FROM recent_trends
        WHERE observedAt >= ${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}
        GROUP BY source, topic
      )
      SELECT 
        rt.*,
        bt.baseline_score,
        bt.baseline_velocity,
        (rt.score - bt.baseline_score) / NULLIF(bt.baseline_score, 0) * 100 as score_deviation_percent
      FROM recent_trends rt
      LEFT JOIN baseline_trends bt ON rt.source = bt.source AND rt.topic = bt.topic
      ORDER BY rt.score DESC, rt.velocity DESC
      LIMIT 50
    `;

    const result = await sql.unsafe(query);
    return result;
  }

  private async createDeliveries(rule: any, trends: any[]): Promise<void> {
    const title = `Alert: ${rule.name}`;
    const message = this.formatAlertMessage(rule, trends);
    const metadata = {
      ruleId: rule.id,
      trends: trends.slice(0, 10), // Limit to top 10 trends
      triggeredAt: new Date().toISOString()
    };

    // Create delivery records for each channel
    for (const channel of rule.deliveryChannels) {
      await prisma.alertDelivery.create({
        data: {
          ruleId: rule.id,
          channel,
          title,
          message,
          metadata,
          status: 'PENDING',
          nextAttemptAt: new Date()
        }
      });
    }
  }

  private formatAlertMessage(rule: any, trends: any[]): string {
    const topTrends = trends.slice(0, 3);
    const trendList = topTrends.map(t => `• ${t.topic} (${t.source}, score: ${t.score.toFixed(1)})`).join('\n');
    
    return `Alert triggered for rule "${rule.name}"

${trends.length} trends meet your criteria:

${trends.length > 3 ? trendList + '\n... and ' + (trends.length - 3) + ' more' : trendList}

View details: ${process.env.BASE_URL}/alerts`;
  }

  async processPendingDeliveries(): Promise<void> {
    const pendingDeliveries = await prisma.alertDelivery.findMany({
      where: {
        status: 'PENDING',
        nextAttemptAt: {
          lte: new Date()
        }
      },
      include: {
        rule: true
      }
    });

    for (const delivery of pendingDeliveries) {
      try {
        await this.processDelivery(delivery);
      } catch (error) {
        console.error(`Error processing delivery ${delivery.id}:`, error);
        
        // Update delivery with error
        await prisma.alertDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            attemptCount: { increment: 1 },
            lastAttemptAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }
  }

  private async processDelivery(delivery: any): Promise<void> {
    // Update attempt tracking
    await prisma.alertDelivery.update({
      where: { id: delivery.id },
      data: {
        attemptCount: { increment: 1 },
        lastAttemptAt: new Date()
      }
    });

    switch (delivery.channel) {
      case 'WEBHOOK':
        await this.deliverWebhook(delivery);
        break;
      case 'EMAIL':
        await this.deliverEmail(delivery);
        break;
      case 'IN_APP':
        // In-app notifications are handled by the frontend
        await prisma.alertDelivery.update({
          where: { id: delivery.id },
          data: { status: 'SENT' }
        });
        break;
      default:
        throw new Error(`Unknown delivery channel: ${delivery.channel}`);
    }
  }

  private async deliverWebhook(delivery: any): Promise<void> {
    if (!delivery.rule.webhookUrl) {
      throw new Error('No webhook URL configured for rule');
    }

    const payload: WebhookPayload = {
      rule_id: delivery.rule.id,
      rule_name: delivery.rule.name,
      triggered_at: delivery.createdAt.toISOString(),
      trends: delivery.metadata.trends || [],
      message: delivery.message,
      metadata: delivery.metadata
    };

    const timeoutMs = parseInt(process.env.ALERT_WEBHOOK_TIMEOUT_MS || '5000');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(delivery.rule.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrenderAI-Alerts/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseBody = await response.text();

      await prisma.alertDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SENT',
          responseStatus: response.status,
          responseBody
        }
      });

    } catch (error) {
      clearTimeout(timeoutId);
      
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const status = isTimeout ? 'RATE_LIMITED' : 'FAILED';
      
      await prisma.alertDelivery.update({
        where: { id: delivery.id },
        data: {
          status,
          responseStatus: isTimeout ? 408 : 500,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          nextAttemptAt: new Date(Date.now() + 5 * 60 * 1000) // Retry in 5 minutes
        }
      });

      throw error;
    }
  }

  private async deliverEmail(delivery: any): Promise<void> {
    if (!delivery.rule.emailAddress) {
      throw new Error('No email address configured for rule');
    }

    // TODO: Implement email delivery
    // For now, just mark as sent
    await prisma.alertDelivery.update({
      where: { id: delivery.id },
      data: { status: 'SENT' }
    });
  }

  // TTI Metrics Integration
  async recordTTIMetrics(operation: string, duration: number, success: boolean): Promise<void> {
    try {
      await prisma.tTIMetric.create({
        data: {
          sessionId: 'alert-evaluator',
          traceId: `alert-${Date.now()}`,
          metricName: `alert_${operation}_duration`,
          metricValue: duration,
          unit: 'ms',
          timestamp: new Date(),
          source: 'server',
          metadata: {
            operation,
            success,
            component: 'AlertEvaluator'
          }
        }
      });
    } catch (error) {
      console.error('Failed to record TTI metrics:', error);
    }
  }
}

export const alertEvaluator = new AlertEvaluator();
