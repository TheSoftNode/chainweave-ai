# ChainWeave AI Backend - GCP Deployment Guide

This guide will help you deploy the ChainWeave AI Backend to Google Cloud Platform (GCP) using App Engine.

## 🚀 Quick Deployment

### Prerequisites

1. **Google Cloud SDK**: Install the gcloud CLI

   ```bash
   # macOS
   brew install google-cloud-sdk

   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **GCP Project**: Create a new GCP project or use an existing one

   ```bash
   gcloud projects create your-project-id
   gcloud config set project your-project-id
   ```

3. **Authentication**: Login to your Google Cloud account
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

### Environment Setup

1. **Create Production Environment File**:

   ```bash
   cp .env.production.template .env.production
   ```

2. **Update Production Values**:
   Edit `.env.production` with your production configuration:
   - Database URLs (MongoDB Atlas)
   - API keys (Gemini, OpenAI, Pinata)
   - JWT secrets
   - Contract addresses
   - Admin wallet addresses

### Deployment Steps

1. **Set Environment Variables**:

   ```bash
   export GCP_PROJECT_ID="your-project-id"
   export GCP_REGION="us-central1"
   ```

2. **Setup Secrets (Optional but Recommended)**:

   ```bash
   ./setup-secrets.sh
   ```

3. **Deploy to GCP**:
   ```bash
   ./deploy-gcp.sh
   ```

## 📋 Manual Deployment

If you prefer manual deployment:

### 1. Enable APIs

```bash
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Create App Engine Application

```bash
gcloud app create --region=us-central1
```

### 3. Build Application

```bash
npm ci
npm run build
```

### 4. Deploy

```bash
gcloud app deploy app.yaml
```

### 5. View Logs

```bash
gcloud app logs tail -s default
```

## 🔐 Security Configuration

### Environment Variables in App Engine

You can set environment variables directly in `app.yaml` or use GCP Secret Manager:

1. **Using app.yaml** (Not recommended for sensitive data):

   ```yaml
   env_variables:
     NODE_ENV: production
     GEMINI_API_KEY: your-api-key
   ```

2. **Using Secret Manager** (Recommended):

   ```bash
   # Create secrets
   echo "your-secret-value" | gcloud secrets create my-secret --data-file=-

   # Access in app.yaml
   env_variables:
     GEMINI_API_KEY: projects/PROJECT_ID/secrets/my-secret/versions/latest
   ```

### 3. MongoDB Atlas Setup

1. **Whitelist GCP IPs**: In MongoDB Atlas, add `0.0.0.0/0` to IP whitelist for App Engine
2. **Update Connection String**: Use the production MongoDB URI in `.env.production`

## 📊 Monitoring & Logging

### View Application Logs

```bash
gcloud app logs tail -s default
```

### Monitor Performance

- **GCP Console**: https://console.cloud.google.com/appengine
- **Logs Explorer**: https://console.cloud.google.com/logs
- **Monitoring**: https://console.cloud.google.com/monitoring

### Health Checks

The application includes built-in health checks:

- **Endpoint**: `https://your-app.appspot.com/health`
- **API Health**: `https://your-app.appspot.com/api/v1/health`

## 🔧 Configuration Files

### app.yaml

- **Runtime**: Node.js 20
- **Scaling**: Automatic (1-10 instances)
- **Resources**: 1 CPU, 2GB RAM
- **Health Checks**: Enabled

### cloudbuild.yaml

- **Build Steps**: Install, Build, Deploy
- **Timeout**: 20 minutes
- **Machine Type**: High CPU

### Dockerfile

- **Base Image**: Node.js 20 Alpine
- **Security**: Non-root user
- **Health Checks**: Enabled

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:

   ```bash
   # Clear node_modules and rebuild
   rm -rf node_modules
   npm ci
   npm run build
   ```

2. **Memory Issues**:
   - Increase memory in `app.yaml` → `resources.memory_gb: 4`

3. **Environment Variables Not Found**:
   - Check `.env.production` exists
   - Verify secret names in GCP Secret Manager

4. **Database Connection Issues**:
   - Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
   - Check connection string format

### Debug Commands

```bash
# View app details
gcloud app describe

# View versions
gcloud app versions list

# View services
gcloud app services list

# SSH into instance (for debugging)
gcloud app instances ssh INSTANCE_ID --service=default
```

## 🌐 Custom Domain

To use a custom domain:

1. **Map Domain**:

   ```bash
   gcloud app domain-mappings create api.chainweave.ai
   ```

2. **Update DNS**: Add the required DNS records provided by GCP

3. **SSL Certificate**: Automatically provisioned by App Engine

## 💰 Cost Management

### App Engine Pricing

- **Free Tier**: 28 instance hours/day
- **Standard Environment**: Pay per instance hour
- **Automatic Scaling**: Scales down to 0 when not in use

### Cost Optimization

1. **Set max instances**: Limit in `app.yaml`
2. **Monitor usage**: Use GCP billing alerts
3. **Scale down**: Configure `min_instances: 0` for non-production

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to GCP
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      - run: gcloud app deploy
```

## 🎉 Post-Deployment

After successful deployment:

1. **Test All Endpoints**: Run the authentication test script
2. **Monitor Logs**: Check for any runtime errors
3. **Update Frontend**: Point frontend to new backend URL
4. **Set up Monitoring**: Configure alerts and dashboards

## 📞 Support

For deployment issues:

- **GCP Documentation**: https://cloud.google.com/appengine/docs
- **ChainWeave Team**: Create an issue in the repository
- **GCP Support**: Available with paid support plans
