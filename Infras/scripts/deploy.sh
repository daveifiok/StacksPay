#!/bin/bash

# StacksPay Cloud Run Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-project-id"}
REGION=${REGION:-"us-central1"}
BACKEND_SERVICE_NAME="stackspay-backend"
FRONTEND_SERVICE_NAME="stackspay-frontend"

# MongoDB Atlas connection string (REQUIRED: Set this environment variable)
if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}❌ MONGODB_URI environment variable is required${NC}"
    echo "Please set it to your MongoDB Atlas connection string:"
    echo "export MONGODB_URI='mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>'"
    exit 1
fi

echo -e "${BLUE}🚀 Starting StacksPay deployment to Google Cloud Run${NC}"

# Function to check if gcloud is authenticated
check_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
        echo -e "${RED}❌ Please authenticate with Google Cloud: gcloud auth login${NC}"
        exit 1
    fi
}

# Function to set project
set_project() {
    if [ "$PROJECT_ID" = "your-project-id" ]; then
        echo -e "${YELLOW}⚠️  Please set your PROJECT_ID in the script or environment variable${NC}"
        echo "Available projects:"
        gcloud projects list
        exit 1
    fi
    
    echo -e "${BLUE}📋 Setting project to: $PROJECT_ID${NC}"
    gcloud config set project $PROJECT_ID
}

# Function to enable required APIs
enable_apis() {
    echo -e "${BLUE}🔧 Enabling required APIs...${NC}"
    gcloud services enable run.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable containerregistry.googleapis.com
}

# Function to deploy backend
deploy_backend() {
    echo -e "${BLUE}🏗️  Building and deploying backend...${NC}"
    
    cd backend
    
    # Build and submit to Cloud Build
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE_NAME
    
    # Deploy to Cloud Run
    gcloud run deploy $BACKEND_SERVICE_NAME \
        --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 8080 \
        --memory 1Gi \
        --cpu 1 \
        --concurrency 100 \
        --max-instances 10 \
        --set-env-vars "PORT=8080" \
        --set-env-vars "NODE_ENV=production" \
        --set-env-vars "MONGODB_URI=$MONGODB_URI" \
        --set-env-vars "JWT_SECRET=$(openssl rand -base64 32)" \
        --set-env-vars "WEBHOOK_SECRET=$(openssl rand -base64 32)" \
        --set-env-vars "ENCRYPTION_KEY=$(openssl rand -base64 32)" \
        --set-env-vars "STACKS_NETWORK=testnet" \
        --set-env-vars "BITCOIN_NETWORK=testnet" \
        --set-env-vars "CORS_ORIGINS=*"
    
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE_NAME --region=$REGION --format="value(status.url)")
    echo -e "${GREEN}✅ Backend deployed at: $BACKEND_URL${NC}"
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${BLUE}🎨 Building and deploying frontend...${NC}"
    
    if [ -z "$BACKEND_URL" ]; then
        BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE_NAME --region=$REGION --format="value(status.url)")
    fi
    
    cd frontend
    
    # Build and submit to Cloud Build with build args
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE_NAME \
        --substitutions="_NEXT_PUBLIC_API_URL=$BACKEND_URL"
    
    # Deploy to Cloud Run
    gcloud run deploy $FRONTEND_SERVICE_NAME \
        --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 3000 \
        --memory 1Gi \
        --cpu 1 \
        --concurrency 100 \
        --max-instances 10 \
        --set-env-vars "PORT=3000" \
        --set-env-vars "NODE_ENV=production" \
        --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL"
    
    FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE_NAME --region=$REGION --format="value(status.url)")
    echo -e "${GREEN}✅ Frontend deployed at: $FRONTEND_URL${NC}"
    
    cd ..
}

# Function to update backend CORS with frontend URL
update_cors() {
    echo -e "${BLUE}🔄 Updating backend CORS configuration...${NC}"
    
    gcloud run services update $BACKEND_SERVICE_NAME \
        --region $REGION \
        --update-env-vars "CORS_ORIGINS=$FRONTEND_URL,https://*.vercel.app,https://*.netlify.app"
    
    echo -e "${GREEN}✅ CORS updated${NC}"
}

# Function to show deployment info
show_info() {
    echo -e "${GREEN}"
    echo "========================================="
    echo "🎉 StacksPay Deployment Complete!"
    echo "========================================="
    echo "Frontend URL: $FRONTEND_URL"
    echo "Backend URL:  $BACKEND_URL"
    echo "API Docs:     $BACKEND_URL/api-docs"
    echo "Health Check: $BACKEND_URL/health"
    echo "========================================="
    echo -e "${NC}"
    
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. Test the deployment by visiting the frontend URL"
    echo "2. Check API documentation at $BACKEND_URL/api-docs"
    echo "3. Monitor logs: gcloud logging read \"resource.type=cloud_run_revision\""
    echo "4. Set up custom domain (optional)"
    echo "5. Configure MongoDB Atlas IP whitelist if needed"
}

# Main deployment flow
main() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    check_auth
    set_project
    enable_apis
    
    echo -e "${BLUE}🚀 Starting deployment...${NC}"
    deploy_backend
    deploy_frontend
    update_cors
    show_info
}

# Run if this script is called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
