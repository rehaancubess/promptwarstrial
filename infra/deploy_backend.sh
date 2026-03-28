#!/bin/bash
# Deploy Backend to Google Cloud Run

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="hemora-backend"

echo "Deploying Hemora Backend to Cloud Run in project $PROJECT_ID..."
gcloud run deploy $SERVICE_NAME \
  --source ../backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --project $PROJECT_ID \
  --quiet
