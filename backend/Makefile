# =============================================================================
# KUAFCV Backend Makefile
# Production-ready build and deployment commands
# =============================================================================

# Variables
APP_NAME := kuafcv-backend
MAIN_FILE := main.go
BUILD_DIR := ./build
BINARY_NAME := $(APP_NAME)

# Go variables
GO := go
GOFLAGS := -v
LDFLAGS := -s -w

# Docker variables
DOCKER := docker
DOCKER_IMAGE := kuafcv/backend
DOCKER_TAG := latest

# =============================================================================
# DEFAULT TARGET
# =============================================================================
.PHONY: help
help: ## Show this help message
	@echo "KUAFCV Backend - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# DEVELOPMENT
# =============================================================================
.PHONY: dev
dev: ## Run development server with hot reload
	@echo "🚀 Starting development server..."
	$(GO) run $(MAIN_FILE)

.PHONY: run
run: ## Run the application
	$(GO) run $(MAIN_FILE)

.PHONY: watch
watch: ## Run with air hot reload (requires air: go install github.com/cosmtrek/air@latest)
	@which air > /dev/null || (echo "Installing air..." && go install github.com/cosmtrek/air@latest)
	air

# =============================================================================
# DATABASE
# =============================================================================
.PHONY: migrate
migrate: ## Run database migrations only
	@echo "🔄 Running database migrations..."
	RUN_MIGRATION=true $(GO) run $(MAIN_FILE) migrate
	@echo "✅ Migrations completed"

.PHONY: migrate-status
migrate-status: ## Check migration status
	@echo "📋 Checking migration status..."
	$(GO) run $(MAIN_FILE) migrate-status

.PHONY: db-seed
db-seed: ## Seed database with sample data
	@echo "🌱 Seeding database..."
	$(GO) run scripts/seed.go

.PHONY: db-reset
db-reset: ## Reset database (DANGER: drops all data)
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	@echo "🗑️  Resetting database..."
	$(GO) run scripts/reset_db.go

# =============================================================================
# BUILD
# =============================================================================
.PHONY: build
build: ## Build the application for current OS
	@echo "🔨 Building $(APP_NAME)..."
	$(GO) build $(GOFLAGS) -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_FILE)
	@echo "✅ Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

.PHONY: build-linux
build-linux: ## Build for Linux (production)
	@echo "🐧 Building for Linux..."
	GOOS=linux GOARCH=amd64 $(GO) build $(GOFLAGS) -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 $(MAIN_FILE)
	@echo "✅ Linux build complete"

.PHONY: build-windows
build-windows: ## Build for Windows
	@echo "🪟 Building for Windows..."
	GOOS=windows GOARCH=amd64 $(GO) build $(GOFLAGS) -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/$(BINARY_NAME).exe $(MAIN_FILE)
	@echo "✅ Windows build complete"

.PHONY: build-all
build-all: build-linux build-windows ## Build for all platforms

# =============================================================================
# TESTING
# =============================================================================
.PHONY: test
test: ## Run all tests
	@echo "🧪 Running tests..."
	$(GO) test -v ./...

.PHONY: test-coverage
test-coverage: ## Run tests with coverage report
	@echo "📊 Running tests with coverage..."
	$(GO) test -v -cover -coverprofile=coverage.out ./...
	$(GO) tool cover -html=coverage.out -o coverage.html
	@echo "✅ Coverage report: coverage.html"

.PHONY: test-race
test-race: ## Run tests with race detection
	@echo "🏎️  Running tests with race detection..."
	$(GO) test -v -race ./...

# =============================================================================
# CODE QUALITY
# =============================================================================
.PHONY: lint
lint: ## Run linter (requires golangci-lint)
	@which golangci-lint > /dev/null || (echo "Installing golangci-lint..." && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest)
	golangci-lint run

.PHONY: fmt
fmt: ## Format code
	$(GO) fmt ./...

.PHONY: vet
vet: ## Run go vet
	$(GO) vet ./...

.PHONY: tidy
tidy: ## Tidy go modules
	$(GO) mod tidy

.PHONY: check
check: fmt vet lint test ## Run all checks (format, vet, lint, test)

# =============================================================================
# DOCKER
# =============================================================================
.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	$(DOCKER) build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .

.PHONY: docker-run
docker-run: ## Run Docker container
	$(DOCKER) run -p 4000:4000 --env-file .env $(DOCKER_IMAGE):$(DOCKER_TAG)

.PHONY: docker-push
docker-push: ## Push Docker image to registry
	$(DOCKER) push $(DOCKER_IMAGE):$(DOCKER_TAG)

# =============================================================================
# CLEANUP
# =============================================================================
.PHONY: clean
clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)
	rm -f coverage.out coverage.html
	@echo "✅ Clean complete"

# =============================================================================
# PRODUCTION
# =============================================================================
.PHONY: prod-start
prod-start: build-linux ## Build and start in production mode
	@echo "🚀 Starting in production mode..."
	ENVIRONMENT=production ./$(BUILD_DIR)/$(BINARY_NAME)-linux-amd64

.PHONY: prod-deploy
prod-deploy: build-linux ## Deploy to production server
	@echo "📦 Deploying to production..."
	# Add your deployment commands here
	# scp $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 user@server:/opt/kuafcv/
	@echo "⚠️  Configure deployment commands in Makefile"

# =============================================================================
# UTILITIES
# =============================================================================
.PHONY: deps
deps: ## Download dependencies
	@echo "📥 Downloading dependencies..."
	$(GO) mod download
	@echo "✅ Dependencies downloaded"

.PHONY: deps-update
deps-update: ## Update dependencies
	@echo "🔄 Updating dependencies..."
	$(GO) get -u ./...
	$(GO) mod tidy
	@echo "✅ Dependencies updated"

.PHONY: env-check
env-check: ## Check environment variables
	@echo "🔍 Checking environment variables..."
	@test -f .env || (echo "❌ .env file not found" && exit 1)
	@echo "JWT_SECRET: $$(test -n '$$JWT_SECRET' && echo 'SET' || echo 'NOT SET')"
	@echo "DATABASE_URL: $$(test -n '$$DATABASE_URL' && echo 'SET' || echo 'NOT SET')"
	@echo "✅ Environment check complete"

.PHONY: gen-secret
gen-secret: ## Generate a secure JWT secret
	@echo "🔐 Generating JWT secret..."
	@openssl rand -base64 64 | tr -d '\n'
	@echo ""

# Default target
.DEFAULT_GOAL := help
