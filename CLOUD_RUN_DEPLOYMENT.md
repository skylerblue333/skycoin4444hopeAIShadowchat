# Skycoin4444 RC1 - Cloud Run Deployment Guide

**Version:** 1.0  
**Platform:** Google Cloud Run  
**Status:** 🚀 PRODUCTION READY  

---

## Pre-Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] All tests passing (vitest)
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificates ready
- [ ] CDN configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented
- [ ] Team trained on deployment procedures

---

## Step 1: Prepare Application

### 1.1 Build Production Bundle

```bash
cd /home/ubuntu/skycoin_upgrade

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build application
pnpm build

# Verify build output
ls -lh dist/
```

### 1.2 Create Dockerfile

```dockerfile
# Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "dist/index.js"]
```

### 1.3 Create .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env.local
.env.*.local
dist
build
coverage
.next
out
```

---

## Step 2: Set Up Google Cloud Project

### 2.1 Create GCP Project

```bash
# Set project ID
export PROJECT_ID="skycoin4444-prod"
export REGION="us-central1"

# Create project
gcloud projects create $PROJECT_ID --name="Skycoin4444 Production"

# Set as default
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  cloudresourcemanager.googleapis.com \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com
```

### 2.2 Set Up Cloud SQL Database

```bash
# Create Cloud SQL instance
gcloud sql instances create skycoin4444-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=$REGION \
  --availability-type=REGIONAL \
  --backup-start-time=02:00 \
  --enable-bin-log

# Create database
gcloud sql databases create skycoin4444 \
  --instance=skycoin4444-db

# Create database user
gcloud sql users create skycoin \
  --instance=skycoin4444-db \
  --password

# Get connection string
gcloud sql instances describe skycoin4444-db \
  --format="value(connectionName)"
```

### 2.3 Set Up Secrets

```bash
# Create secrets in Secret Manager
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "your-oauth-key" | gcloud secrets create OAUTH_KEY --data-file=-
echo -n "your-database-url" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-api-key" | gcloud secrets create API_KEY --data-file=-

# Grant Cloud Run access to secrets
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:cloud-run@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

---

## Step 3: Build and Push Docker Image

### 3.1 Set Up Artifact Registry

```bash
# Create Artifact Registry repository
gcloud artifacts repositories create skycoin4444 \
  --repository-format=docker \
  --location=$REGION

# Configure Docker authentication
gcloud auth configure-docker $REGION-docker.pkg.dev

# Set image URL
export IMAGE_URL="$REGION-docker.pkg.dev/$PROJECT_ID/skycoin4444/app:latest"
```

### 3.2 Build and Push Image

```bash
# Build Docker image
docker build -t $IMAGE_URL .

# Push to Artifact Registry
docker push $IMAGE_URL

# Verify image
gcloud artifacts docker images list $REGION-docker.pkg.dev/$PROJECT_ID/skycoin4444
```

---

## Step 4: Deploy to Cloud Run

### 4.1 Create Cloud Run Service

```bash
# Deploy to Cloud Run
gcloud run deploy skycoin4444 \
  --image=$IMAGE_URL \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=100 \
  --min-instances=1 \
  --port=3000 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="JWT_SECRET=JWT_SECRET:latest,OAUTH_KEY=OAUTH_KEY:latest,DATABASE_URL=DATABASE_URL:latest,API_KEY=API_KEY:latest" \
  --service-account=cloud-run@$PROJECT_ID.iam.gserviceaccount.com
```

### 4.2 Get Service URL

```bash
# Get Cloud Run service URL
gcloud run services describe skycoin4444 \
  --region=$REGION \
  --format="value(status.url)"

# Save URL for later use
export SERVICE_URL=$(gcloud run services describe skycoin4444 \
  --region=$REGION \
  --format="value(status.url)")

echo "Service URL: $SERVICE_URL"
```

---

## Step 5: Set Up Custom Domain

### 5.1 Map Custom Domain

```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create \
  --service=skycoin4444 \
  --domain=api.skycoin4444.com \
  --region=$REGION

# Get DNS records
gcloud run domain-mappings describe api.skycoin4444.com \
  --region=$REGION
```

### 5.2 Configure DNS

```bash
# Add DNS records to your domain registrar
# Type: A
# Name: api
# Value: <IP from domain mapping>

# Verify DNS resolution
nslookup api.skycoin4444.com

# Wait for SSL certificate provisioning (can take 15 minutes)
```

---

## Step 6: Set Up CDN and Load Balancing

### 6.1 Create Cloud CDN

```bash
# Create backend service
gcloud compute backend-services create skycoin4444-backend \
  --protocol=HTTPS \
  --health-checks=skycoin4444-health-check \
  --global \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=3600 \
  --max-ttl=86400

# Create health check
gcloud compute health-checks create https skycoin4444-health-check \
  --request-path=/health \
  --port=443
```

### 6.2 Create URL Map

```bash
# Create URL map
gcloud compute url-maps create skycoin4444-url-map \
  --default-service=skycoin4444-backend

# Create HTTPS proxy
gcloud compute target-https-proxies create skycoin4444-https-proxy \
  --url-map=skycoin4444-url-map \
  --ssl-certificates=skycoin4444-ssl-cert

# Create forwarding rule
gcloud compute forwarding-rules create skycoin4444-https-rule \
  --global \
  --target-https-proxy=skycoin4444-https-proxy \
  --address=skycoin4444-ip \
  --ports=443
```

---

## Step 7: Set Up Monitoring and Logging

### 7.1 Configure Cloud Monitoring

```bash
# Create monitoring dashboard
gcloud monitoring dashboards create --config-from-file=- <<EOF
{
  "displayName": "Skycoin4444 Production",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Request Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" resource.label.service_name=\"skycoin4444\""
                }
              }
            }]
          }
        }
      },
      {
        "xPos": 6,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Error Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\" resource.label.service_name=\"skycoin4444\""
                }
              }
            }]
          }
        }
      }
    ]
  }
}
EOF
```

### 7.2 Set Up Alerts

```bash
# Create alert policy for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=<CHANNEL_ID> \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

### 7.3 Configure Logging

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skycoin4444" \
  --limit=50 \
  --format=json

# Create log sink for long-term storage
gcloud logging sinks create skycoin4444-logs \
  gs://skycoin4444-logs \
  --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="skycoin4444"'
```

---

## Step 8: Database Migrations

### 8.1 Connect to Cloud SQL

```bash
# Install Cloud SQL Proxy
curl https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -o cloud_sql_proxy
chmod +x cloud_sql_proxy

# Start proxy
./cloud_sql_proxy -instances=$PROJECT_ID:$REGION:skycoin4444-db=tcp:3306 &

# Connect to database
mysql -h 127.0.0.1 -u skycoin -p skycoin4444
```

### 8.2 Run Migrations

```bash
# From Cloud Run service
gcloud run services update skycoin4444 \
  --update-env-vars="RUN_MIGRATIONS=true" \
  --region=$REGION

# Verify migrations completed
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~'Migration completed'" \
  --limit=10
```

---

## Step 9: Verify Deployment

### 9.1 Health Checks

```bash
# Test health endpoint
curl $SERVICE_URL/health

# Expected response:
# {"status":"ok","uptime":123.45,"version":"1.0.0"}

# Test API endpoint
curl $SERVICE_URL/api/trpc/auth.me

# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skycoin4444" \
  --limit=20 \
  --format="table(timestamp,jsonPayload.message)"
```

### 9.2 Performance Testing

```bash
# Install load testing tool
npm install -g artillery

# Create load test config
cat > load-test.yml <<EOF
config:
  target: "$SERVICE_URL"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Spike"
scenarios:
  - name: "User Flow"
    flow:
      - get:
          url: "/health"
      - get:
          url: "/api/trpc/auth.me"
      - post:
          url: "/api/trpc/marketplace.getRecommendations"
          json:
            limit: 10
EOF

# Run load test
artillery run load-test.yml
```

---

## Step 10: Set Up CI/CD Pipeline

### 10.1 Create Cloud Build Configuration

```yaml
# cloudbuild.yaml
steps:
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', '$REGION-docker.pkg.dev/$PROJECT_ID/skycoin4444/app:$SHORT_SHA', '.']

  # Push to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '$REGION-docker.pkg.dev/$PROJECT_ID/skycoin4444/app:$SHORT_SHA']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - run
      - --filename=.
      - --image=$REGION-docker.pkg.dev/$PROJECT_ID/skycoin4444/app:$SHORT_SHA
      - --location=$REGION
      - --cluster=skycoin4444

  # Run smoke tests
  - name: 'gcr.io/cloud-builders/kubectl'
    args: ['exec', '-it', 'skycoin4444-pod', '--', 'npm', 'run', 'test:smoke']

images:
  - '$REGION-docker.pkg.dev/$PROJECT_ID/skycoin4444/app:$SHORT_SHA'
  - '$REGION-docker.pkg.dev/$PROJECT_ID/skycoin4444/app:latest'

options:
  machineType: 'N1_HIGHCPU_8'
  logging: CLOUD_LOGGING_ONLY
```

### 10.2 Connect GitHub Repository

```bash
# Create Cloud Build trigger
gcloud builds triggers create github \
  --name=skycoin4444-deploy \
  --repo-name=skycoin4444 \
  --repo-owner=skylerblue333 \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

---

## Step 11: Backup and Disaster Recovery

### 11.1 Set Up Automated Backups

```bash
# Enable automated backups
gcloud sql backups create \
  --instance=skycoin4444-db \
  --description="Pre-deployment backup"

# Set backup schedule
gcloud sql instances patch skycoin4444-db \
  --backup-start-time=02:00 \
  --retained-backups-count=30
```

### 11.2 Test Restore Procedure

```bash
# Create restore point
gcloud sql backups create \
  --instance=skycoin4444-db \
  --description="Test restore point"

# List available backups
gcloud sql backups list --instance=skycoin4444-db

# Test restore (to temporary instance)
gcloud sql backups restore <BACKUP_ID> \
  --backup-instance=skycoin4444-db \
  --target-instance=skycoin4444-db-restore-test
```

---

## Step 12: Post-Deployment Verification

### 12.1 Smoke Tests

```bash
# Run smoke tests
npm run test:smoke

# Expected results:
# ✓ Health check passed
# ✓ Database connection verified
# ✓ API endpoints responding
# ✓ Authentication working
# ✓ WebSocket connections established
```

### 12.2 User Acceptance Testing

- [ ] Login/registration flow works
- [ ] Wallet operations functional
- [ ] Marketplace browsing works
- [ ] Tournament creation successful
- [ ] Analytics dashboard displays data
- [ ] Mobile app connects to API
- [ ] Real-time updates working
- [ ] Error handling appropriate

---

## Rollback Procedure

### If Deployment Fails

```bash
# Revert to previous version
gcloud run deploy skycoin4444 \
  --image=$PREVIOUS_IMAGE_URL \
  --region=$REGION

# Verify rollback
curl $SERVICE_URL/health

# Check logs for errors
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit=20
```

---

## Monitoring Checklist (Post-Deployment)

- [ ] Error rate < 0.1%
- [ ] P95 latency < 500ms
- [ ] CPU usage < 70%
- [ ] Memory usage < 80%
- [ ] Database connections healthy
- [ ] All API endpoints responding
- [ ] WebSocket connections stable
- [ ] CDN cache hit rate > 80%
- [ ] SSL certificate valid
- [ ] Backups running successfully

---

## Support and Escalation

**On-Call Engineer:** [Contact Info]  
**Incident Channel:** #skycoin-incidents  
**Escalation:** [Escalation Procedure]

---

**Status:** 🚀 Ready for Production Deployment

*For questions, contact: devops@skycoin4444.com*
