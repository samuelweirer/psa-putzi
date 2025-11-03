## 8. CI/CD-PIPELINE (DETAILLIERT)

### 8.1 GitLab CI Configuration

**.gitlab-ci.yml:**
```yaml
stages:
  - build
  - test
  - security
  - package
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  NODE_VERSION: "20"

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/

before_script:
  - node --version
  - npm --version

# ===== BUILD STAGE =====
build:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 day
  only:
    - branches

# ===== TEST STAGE =====
test:unit:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run test:unit
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  only:
    - branches

test:integration:
  stage: test
  image: node:${NODE_VERSION}
  services:
    - postgres:15-alpine
    - redis:7-alpine
  variables:
    POSTGRES_DB: psa_test
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: test_password
    DATABASE_URL: postgres://postgres:test_password@postgres:5432/psa_test
    REDIS_URL: redis://redis:6379
  script:
    - npm ci
    - npm run test:integration
  only:
    - branches

test:e2e:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0
  script:
    - npm ci
    - npx playwright install
    - npm run test:e2e
  artifacts:
    when: on_failure
    paths:
      - playwright-report/
    expire_in: 7 days
  only:
    - merge_requests
    - main
    - develop

# ===== SECURITY STAGE =====
security:sast:
  stage: security
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm audit --production --audit-level=high
  allow_failure: true
  only:
    - branches

security:dependency-scan:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy fs --severity HIGH,CRITICAL --no-progress .
  allow_failure: true
  only:
    - merge_requests
    - main

security:secrets-scan:
  stage: security
  image: trufflesecurity/trufflehog:latest
  script:
    - trufflehog filesystem . --only-verified
  allow_failure: false
  only:
    - branches

# ===== PACKAGE STAGE =====
package:lxc-template:
  stage: package
  script:
    - ./scripts/create-lxc-template.sh
  artifacts:
    paths:
      - dist/psa-service.tar.zst
    expire_in: 30 days
  only:
    - main
    - develop

# ===== DEPLOY STAGE =====
deploy:staging:
  stage: deploy
  environment:
    name: staging
    url: https://staging-api.psa-platform.example.com
  script:
    - ./scripts/deploy-to-staging.sh
  only:
    - develop
  when: manual

deploy:production:
  stage: deploy
  environment:
    name: production
    url: https://api.psa-platform.example.com
  script:
    - ./scripts/deploy-to-production.sh
  only:
    - main
  when: manual
  needs:
    - test:unit
    - test:integration
    - test:e2e
    - security:sast
```

### 8.2 Deployment-Scripts

**deploy-to-production.sh:**
```bash
#!/bin/bash
set -euo pipefail

SERVICE_NAME="crm"
CONTAINER_ID=101
BACKUP_DIR="/backup/pre-deployment"
DEPLOYMENT_DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment of $SERVICE_NAME to production..."

# 1. Pre-deployment checks
echo "📋 Running pre-deployment checks..."
./scripts/pre-deployment-checks.sh || exit 1

# 2. Create backup
echo "💾 Creating backup..."
vzdump $CONTAINER_ID --compress zstd --mode snapshot --dumpdir $BACKUP_DIR
BACKUP_FILE=$(ls -t $BACKUP_DIR/vzdump-lxc-$CONTAINER_ID-* | head -1)
echo "✅ Backup created: $BACKUP_FILE"

# 3. Stop service
echo "⏸️  Stopping service..."
pct exec $CONTAINER_ID -- systemctl stop psa.service

# 4. Deploy new version
echo "📦 Deploying new version..."
pct exec $CONTAINER_ID -- bash -c "
    cd /opt/psa
    git fetch origin
    git checkout $CI_COMMIT_SHA
    npm ci --production
    npm run db:migrate
"

# 5. Start service
echo "▶️  Starting service..."
pct exec $CONTAINER_ID -- systemctl start psa.service

# 6. Health check
echo "🏥 Running health checks..."
sleep 10
for i in {1..30}; do
    if curl -f http://10.0.10.11:3000/health > /dev/null 2>&1; then
        echo "✅ Service is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Health check failed after 30 attempts"
        echo "🔄 Rolling back..."
        pct exec $CONTAINER_ID -- systemctl stop psa.service
        pct restore $CONTAINER_ID $BACKUP_FILE --force
        pct start $CONTAINER_ID
        exit 1
    fi
    echo "Waiting for service to be healthy... ($i/30)"
    sleep 2
done

# 7. Smoke tests
echo "🧪 Running smoke tests..."
./scripts/smoke-tests.sh || {
    echo "❌ Smoke tests failed, rolling back..."
    pct exec $CONTAINER_ID -- systemctl stop psa.service
    pct restore $CONTAINER_ID $BACKUP_FILE --force
    pct start $CONTAINER_ID
    exit 1
}

# 8. Cleanup old backups
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "vzdump-lxc-$CONTAINER_ID-*" -mtime +7 -delete

echo "✅ Deployment completed successfully!"
echo "📊 Deployment summary:"
echo "  - Service: $SERVICE_NAME"
echo "  - Container: $CONTAINER_ID"
echo "  - Commit: $CI_COMMIT_SHA"
echo "  - Backup: $BACKUP_FILE"
echo "  - Date: $DEPLOYMENT_DATE"

# 9. Notify team
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
    -H 'Content-Type: application/json' \
    -d "{
        \"text\": \"✅ Deployment successful: $SERVICE_NAME @ $CI_COMMIT_SHA\",
        \"attachments\": [{
            \"color\": \"good\",
            \"fields\": [
                {\"title\": \"Service\", \"value\": \"$SERVICE_NAME\", \"short\": true},
                {\"title\": \"Commit\", \"value\": \"$CI_COMMIT_SHA\", \"short\": true},
                {\"title\": \"Date\", \"value\": \"$DEPLOYMENT_DATE\", \"short\": true}
            ]
        }]
    }"
```

---
