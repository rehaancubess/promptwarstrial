#!/bin/bash
# Deploy Frontend to Google Cloud Run

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="hemora-frontend"

echo "Deploying Hemora Frontend to Cloud Run in project $PROJECT_ID..."
gcloud run deploy $SERVICE_NAME \
  --source ../frontend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --project $PROJECT_ID \
  --quiet
