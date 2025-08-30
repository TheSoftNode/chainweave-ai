#!/bin/bash

# ChainWeave AI Backend - GCP Deployment Script
set -e

echo "🚀 Starting ChainWeave AI Backend deployment to GCP..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="chainweave-ai-backend"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo -e "  Project ID: ${PROJECT_ID}"
echo -e "  Region: ${REGION}"
echo -e "  Service: ${SERVICE_NAME}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo -e "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if logged in to gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to gcloud. Please login first:${NC}"
    echo -e "  gcloud auth login"
    exit 1
fi

# Set project
echo -e "${BLUE}🔧 Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${BLUE}🔌 Enabling required GCP APIs...${NC}"
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com

# Create App Engine app if it doesn't exist
echo -e "${BLUE}🏗️  Setting up App Engine...${NC}"
if ! gcloud app describe &> /dev/null; then
    echo -e "${YELLOW}Creating new App Engine application...${NC}"
    gcloud app create --region=$REGION
else
    echo -e "${GREEN}✅ App Engine application already exists${NC}"
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating template...${NC}"
    cp .env .env.production
    echo -e "${RED}❗ Please update .env.production with production values before deploying!${NC}"
    exit 1
fi

# Build the application
echo -e "${BLUE}🔨 Building application...${NC}"
npm ci
npm run build

# Deploy to App Engine
echo -e "${BLUE}🚀 Deploying to App Engine...${NC}"
gcloud app deploy app.yaml --quiet

# Get the deployed URL
APP_URL=$(gcloud app browse --no-launch-browser)
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application URL: ${APP_URL}${NC}"
echo -e "${GREEN}📊 View logs: gcloud app logs tail -s default${NC}"
echo -e "${GREEN}📈 View metrics: https://console.cloud.google.com/appengine${NC}"

# Test the deployment
echo -e "${BLUE}🧪 Testing deployment...${NC}"
if curl -f -s "${APP_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed. Check logs for issues.${NC}"
fi

echo ""
echo -e "${GREEN}🚀 ChainWeave AI Backend is now live on GCP!${NC}"
