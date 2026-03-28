# Deploy Backend to Google Cloud Run
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="hemora-backend"
set -a
source ../backend/.env || true
set +a
echo "Deploying Hemora Backend to Cloud Run in project $PROJECT_ID..."
gcloud run deploy $SERVICE_NAME \
  --source ../backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --project $PROJECT_ID \
  --set-env-vars="GEMINI_API_KEY=$GEMINI_API_KEY,GCP_PROJECT_ID=$PROJECT_ID" \
  --quiet
