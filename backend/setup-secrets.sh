#!/bin/bash

# ChainWeave AI Backend - GCP Secrets Management
set -e

echo "🔐 Setting up GCP Secret Manager for ChainWeave AI Backend..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}

# Function to create a secret
create_secret() {
    local secret_name=$1
    local secret_value=$2
    
    echo -e "${BLUE}Creating secret: ${secret_name}${NC}"
    
    # Check if secret already exists
    if gcloud secrets describe $secret_name --project=$PROJECT_ID &> /dev/null; then
        echo -e "${YELLOW}Secret ${secret_name} already exists, updating...${NC}"
        echo -n "$secret_value" | gcloud secrets versions add $secret_name --data-file=- --project=$PROJECT_ID
    else
        echo -n "$secret_value" | gcloud secrets create $secret_name --data-file=- --project=$PROJECT_ID
    fi
}

# Enable Secret Manager API
echo -e "${BLUE}🔌 Enabling Secret Manager API...${NC}"
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production file not found!${NC}"
    echo -e "${YELLOW}Please create .env.production with your production values first.${NC}"
    exit 1
fi

echo -e "${BLUE}📝 Reading environment variables from .env.production...${NC}"

# Create secrets from .env.production file
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove any leading/trailing whitespace
    key=$(echo "$key" | tr -d '[:space:]')
    value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    
    # Skip if value is empty or placeholder
    if [[ -z "$value" || "$value" =~ ^your- ]]; then
        echo -e "${YELLOW}⚠️  Skipping ${key} (empty or placeholder value)${NC}"
        continue
    fi
    
    # Convert to lowercase for secret name
    secret_name=$(echo "chainweave-${key}" | tr '[:upper:]' '[:lower:]' | tr '_' '-')
    
    create_secret "$secret_name" "$value"
    
done < .env.production

echo ""
echo -e "${GREEN}✅ All secrets have been created in GCP Secret Manager!${NC}"
echo ""
echo -e "${BLUE}📋 To view your secrets:${NC}"
echo -e "  gcloud secrets list --project=$PROJECT_ID"
echo ""
echo -e "${BLUE}🔧 To grant App Engine access to secrets, run:${NC}"
echo -e "  gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo -e "    --member=\"serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com\" \\"
echo -e "    --role=\"roles/secretmanager.secretAccessor\""
echo ""
echo -e "${GREEN}🎉 Secret management setup complete!${NC}"
