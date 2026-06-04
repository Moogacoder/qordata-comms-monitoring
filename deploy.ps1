# qordata Comms Monitoring App - Google Cloud Run Deployment Script
# PowerShell environment

$PROJECT_ID = "qordata-comms-mon-2026"
$REGION = "us-central1"
$REPO_NAME = "qordata-comms-mon-repo"
$IMAGE_NAME = "comms-app"
$SERVICE_NAME = "qordata-comms-monitoring"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Deploying qordata Comms Monitoring App to GCP" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Config project
Write-Host "Setting gcloud project context to $PROJECT_ID..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# 2. Setup Firestore Database
Write-Host "Initializing Firestore Database (Native Mode) in $REGION..." -ForegroundColor Yellow
try {
    gcloud firestore databases create --location=$REGION --quiet
    Write-Host "Firestore database initialized successfully." -ForegroundColor Green
} catch {
    Write-Host "Firestore database initialization skipped (might already exist)." -ForegroundColor Gray
}

# 3. Create Artifact Registry
Write-Host "Creating Artifact Registry Repository $REPO_NAME in $REGION..." -ForegroundColor Yellow
try {
    gcloud artifacts repositories create $REPO_NAME `
        --repository-format=docker `
        --location=$REGION `
        --description="Docker repository for qordata Comms Monitoring App" `
        --quiet
    Write-Host "Artifact Registry repository created." -ForegroundColor Green
} catch {
    Write-Host "Artifact Registry repository creation skipped (might already exist)." -ForegroundColor Gray
}

# 4. Build and Push Container using Cloud Build
Write-Host "Submitting build to Google Cloud Build..." -ForegroundColor Yellow
$IMAGE_TAG = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"
gcloud builds submit --tag $IMAGE_TAG .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Cloud Build failed. Aborting deployment."
    exit $LASTEXITCODE
}

# 5. Deploy to Google Cloud Run
Write-Host "Deploying container image to Cloud Run service $SERVICE_NAME..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
    --image=$IMAGE_TAG `
    --platform=managed `
    --region=$REGION `
    --allow-unauthenticated `
    --port=8080 `
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" `
    --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "SUCCESS: qordata Comms Monitoring App is live on Cloud Run!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Error "Cloud Run deployment failed."
    exit $LASTEXITCODE
}
