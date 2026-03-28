# Deploy Frontend to Google Cloud Run
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="hemora-frontend"
BACKEND_URL="https://hemora-backend-713215250376.us-central1.run.app"

echo "Deploying Hemora Frontend to Cloud Run in project $PROJECT_ID..."
set -a
source ../frontend/.env || true
set +a

gcloud run deploy $SERVICE_NAME \
  --source ../frontend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --project $PROJECT_ID \
  --set-build-env-vars="VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY,VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN,VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID,VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET,VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID,VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID,VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID,VITE_API_URL=$BACKEND_URL" \
  --quiet
