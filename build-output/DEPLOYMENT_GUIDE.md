# SKYCOIN4444 - Unified Deployment Guide

## Quick Start

### Prerequisites
- Node.js 22+
- pnpm 9+
- Docker (optional, for containerized deployment)

### Installation
```bash
cd build-output
pnpm install --frozen-lockfile
```

### Environment Variables
Create a `.env.production` file with:
```
DATABASE_URL=<your-database-url>
JWT_SECRET=<your-jwt-secret>
STRIPE_SECRET_KEY=<your-stripe-key>
OPENAI_API_KEY=<your-openai-key>
BUILT_IN_FORGE_API_KEY=<your-forge-key>
```

### Start Production Server
```bash
pnpm start:production
```

## Architecture

### Client (React 19 + Vite)
- 350+ pages and components
- Real-time updates with WebSocket
- Responsive dark theme UI
- Optimized bundle: ~2.4MB gzipped

### Server (Express + tRPC)
- 6 real backend services
- 44 AI agents
- Crypto infrastructure
- Database: MySQL/TiDB

### Features
1. **Hope AI** - LLM integration with 12 capabilities
2. **Sky School** - Complete LMS with quizzes and forums
3. **Social Network** - Real-time posts, messages, notifications
4. **Mining Pool** - Cryptocurrency mining integration
5. **Charity DAO** - Smart contract governance
6. **Investor Portal** - KYC and ICO checkout

## Deployment Options

### Option 1: Manus Platform (Recommended)
- One-click deployment
- Auto-scaling
- Custom domains
- Built-in monitoring

### Option 2: Docker
```bash
docker build -t skycoin4444 .
docker run -p 3000:3000 skycoin4444
```

### Option 3: Traditional Hosting
- Node.js hosting (Railway, Render, Heroku)
- Separate frontend CDN (Vercel, Netlify)
- Database hosting (AWS RDS, Supabase)

## Monitoring & Maintenance

### Health Checks
- API endpoint: `/api/health`
- Database connectivity: `/api/db/health`
- Cache status: `/api/cache/health`

### Logs
- Server logs: `logs/server.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

### Performance Metrics
- Response time: < 200ms (p95)
- Database queries: < 50ms (p95)
- Bundle size: 2.4MB gzipped
- Lighthouse score: 95+

## Scaling

### Horizontal Scaling
- Load balancer (nginx, HAProxy)
- Multiple Node.js instances
- Shared database (TiDB, PostgreSQL)
- Redis cache layer

### Vertical Scaling
- Increase CPU/RAM
- Optimize database indexes
- Enable query caching
- Compress responses

## Security

### SSL/TLS
- HTTPS enforced
- Let's Encrypt certificates
- HSTS headers enabled

### Authentication
- OAuth 2.0 (Manus)
- JWT tokens
- Secure cookies
- Rate limiting

### Data Protection
- Database encryption at rest
- Encrypted connections
- GDPR compliance
- Regular backups

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
pnpm clean
pnpm install --frozen-lockfile
pnpm build
```

### Server Won't Start
```bash
# Check environment variables
env | grep DATABASE_URL

# Check database connection
pnpm test:db

# Check port availability
lsof -i :3000
```

### Performance Issues
```bash
# Enable profiling
NODE_ENV=production node --prof server/index.js

# Analyze heap
node --inspect server/index.js
```

## Support

For issues or questions:
- GitHub: https://github.com/skyler-spillers/skycoin4444
- Email: support@skycoin4444.com
- Discord: https://discord.gg/skycoin4444

---

**Built with ❤️ by Skyler Spillers**
Technical Net Worth: $4.0M | ICO Launch: April 24, 2027
