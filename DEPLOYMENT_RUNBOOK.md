# Vercel Cron Deployment Runbook

## Overview
This runbook provides step-by-step instructions for deploying automated data ingestion on Vercel with secure authentication.

## Prerequisites
- Vercel account with project access
- PostgreSQL database (Neon recommended)
- Environment variables configured

## 1. Environment Setup

### Required Environment Variables
Set these in Vercel Project → Settings → Environment Variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
CRON_SECRET="your-super-secure-cron-secret-key-here"

# Feature Toggles
ENABLE_REDDIT=true
ENABLE_NYTIMES=false
ENABLE_YOUTUBE=false

# Optional API Keys (only if features enabled)
NYTIMES_API_KEY=""
YOUTUBE_API_KEY=""

# Performance
DB_POOL_SIZE=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000
```

### Security Best Practices
- Use a strong, random `CRON_SECRET` (32+ characters)
- Never commit secrets to version control
- Rotate secrets regularly
- Use different secrets for staging/production

## 2. Database Preparation

### Local Setup
```bash
# Initialize database schema
npm run db:init

# Create unique index for concurrent operations
npm run db:mv-unique

# Verify setup
npm run db:refresh-mv
```

### Production Database
Ensure your PostgreSQL database supports:
- Materialized views
- Concurrent refresh operations
- Connection pooling

## 3. Deployment

### Automatic Deployment
1. Push code to main branch
2. Vercel automatically detects `vercel.json` cron configuration
3. Cron job will be scheduled automatically

### Manual Deployment
```bash
# Deploy to Vercel
vercel --prod

# Verify cron configuration
vercel cron ls
```

## 4. Testing

### Local Testing
```bash
# Test authentication
npm run test:cron-auth

# Test manual ingestion
curl -X POST "http://localhost:3000/api/ingest" \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"

# Test health check
curl "http://localhost:3000/api/ingest?secret=your-cron-secret"
```

### Production Testing
```bash
# Test with Bearer token
curl -X POST "https://your-app.vercel.app/api/ingest" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"

# Test with query parameter
curl -X POST "https://your-app.vercel.app/api/ingest?secret=$CRON_SECRET" \
  -H "Content-Type: application/json"
```

## 5. Monitoring & Verification

### Vercel Function Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Check `/api/ingest` function logs
3. Monitor execution times and errors

### Data Verification
1. Check `/trends` endpoint for new data
2. Verify materialized view is being refreshed
3. Monitor database connection pool usage

### Health Checks
```bash
# Check ingestion health
curl "https://your-app.vercel.app/api/ingest?secret=$CRON_SECRET"

# Check overall health
curl "https://your-app.vercel.app/api/health"
```

## 6. Troubleshooting

### Common Issues

#### Authentication Failures
- Verify `CRON_SECRET` is set correctly
- Check both query param and Bearer token methods
- Ensure no extra whitespace in secret

#### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from Vercel
- Monitor connection pool limits

#### Materialized View Refresh Failures
- Ensure unique index exists: `npm run db:mv-unique`
- Check for concurrent access conflicts
- Verify database permissions

#### Performance Issues
- Monitor function execution times
- Check database query performance
- Consider adjusting `DB_POOL_SIZE`

### Debug Commands
```bash
# Check database connectivity
npm run db:test

# Refresh materialized view manually
npm run db:refresh-mv

# Run ingestion manually
npm run ingest:run

# View function logs
vercel logs --follow
```

## 7. Maintenance

### Regular Tasks
- Monitor function execution logs
- Check data freshness and quality
- Review error rates and performance
- Update dependencies regularly

### Scaling Considerations
- Monitor database connection usage
- Consider read replicas for heavy traffic
- Implement rate limiting if needed
- Add more data sources gradually

## 8. Security Checklist

- [ ] `CRON_SECRET` is strong and unique
- [ ] Environment variables are encrypted
- [ ] Database connection uses SSL
- [ ] No sensitive data in logs
- [ ] API endpoints are properly authenticated
- [ ] Rate limiting is configured
- [ ] Error messages don't leak sensitive info

## 9. Rollback Plan

If issues occur:
1. Disable cron in `vercel.json` temporarily
2. Revert to previous deployment
3. Fix issues in development
4. Re-enable cron after testing

## Support

For issues:
1. Check Vercel function logs
2. Review this runbook
3. Test locally first
4. Contact support if needed

---

**Last Updated**: August 19, 2025
**Version**: 1.0
