.PHONY: help dev build test lint clean migrate seed docker-up docker-down install

# Default target
help: ## Show this help message
	@echo "Trender AI - Development Commands"
	@echo "=================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}\' $(MAKEFILE_LIST)

# Development
dev: ## Run development environment (web + api concurrently)
	@echo "Starting Trender AI development environment..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env file from template"; fi
	@echo "Starting Next.js frontend..."
	@npm run dev &
	@echo "Starting FastAPI backend..."
	@cd api && python -m uvicorn main:app --reload --port 8000 &
	@echo "Starting background workers..."
	@cd workers && python -m scheduler --dev &
	@echo "All services started. Press Ctrl+C to stop."
	@wait

install: ## Install all dependencies
	@echo "Installing Node.js dependencies..."
	@npm install
	@echo "Installing Python dependencies..."
	@pip install -r requirements.txt
	@echo "Installing development dependencies..."
	@pip install -r requirements-dev.txt

# Database
migrate: ## Run database migrations
	@echo "Running database migrations..."
	@python -c "from workers.database import run_migrations; run_migrations()"

seed: ## Populate database with sample data
	@echo "Seeding database with sample data..."
	@python -c "from workers.seed import create_sample_data; create_sample_data()"

reset-db: ## Reset database (WARNING: Destroys all data)
	@echo "WARNING: This will destroy all database data!"
	@read -p "Are you sure? (y/N): \" confirm && [ "$$confirm" = "y" ]
	@python -c "from workers.database import reset_database; reset_database()"
	@make migrate
	@make seed

# Testing
test: ## Run all tests
	@echo "Running Python tests..."
	@pytest workers/tests/ -v
	@echo "Running Node.js tests..."
	@npm test

test-coverage: ## Run tests with coverage report
	@pytest workers/tests/ --cov=workers --cov-report=html --cov-report=term

lint: ## Run linting and formatting
	@echo "Running Python linting..."
	@flake8 workers/ api/
	@black workers/ api/ --check
	@echo "Running Node.js linting..."
	@npm run lint

format: ## Format code
	@echo "Formatting Python code..."
	@black workers/ api/
	@echo "Formatting TypeScript/JavaScript..."
	@npm run lint -- --fix

# Docker
docker-up: ## Start all services with Docker Compose
	@docker-compose up -d
	@echo "All services started with Docker"
	@echo "Web: http://localhost:3000"
	@echo "API: http://localhost:8000"

docker-dev: ## Start development environment with Docker Compose
	@docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

docker-down: ## Stop all Docker services
	@docker-compose down

docker-logs: ## View logs from all Docker services
	@docker-compose logs -f

docker-build: ## Build all Docker images
	@docker-compose build

# Production
build: ## Build for production
	@echo "Building Next.js application..."
	@npm run build
	@echo "Building Docker images..."
	@docker-compose build

deploy: build ## Deploy to production (placeholder)
	@echo "Deployment configuration needed"
	@echo "Configure your production environment and deployment pipeline"

# Utilities
clean: ## Clean build artifacts and cache
	@echo "Cleaning build artifacts..."
	@rm -rf .next/
	@rm -rf node_modules/.cache/
	@rm -rf __pycache__/
	@find . -name "*.pyc" -delete
	@find . -name "__pycache__" -type d -exec rm -rf {} +
	@docker system prune -f

logs-api: ## View API logs
	@docker-compose logs -f api

logs-workers: ## View worker logs  
	@docker-compose logs -f workers

logs-web: ## View web logs
	@docker-compose logs -f web

health: ## Check health of all services
	@echo "Checking service health..."
	@curl -f http://localhost:3000 > /dev/null && echo "✓ Web service healthy" || echo "✗ Web service down"
	@curl -f http://localhost:8000/health > /dev/null && echo "✓ API service healthy" || echo "✗ API service down"

# Data management
backup-db: ## Backup database
	@echo "Creating database backup..."
	@python -c "from workers.database import backup_database; backup_database()"

restore-db: ## Restore database from backup
	@echo "Restoring database from backup..."
	@python -c "from workers.database import restore_database; restore_database()"

# Documentation
docs: ## Generate documentation
	@echo "Generating API documentation..."
	@python -c "from api.main import app; import json; print(json.dumps(app.openapi(), indent=2))" > docs/api-spec.json
	@echo "Documentation generated in docs/"

# Development helpers
shell-api: ## Open shell in API container
	@docker-compose exec api bash

shell-workers: ## Open shell in workers container
	@docker-compose exec workers bash

monitor: ## Monitor system resources
	@docker-compose exec api htop

# Quick start
quickstart: install migrate seed ## Quick setup for new developers
	@echo ""
	@echo "🚀 Trender AI Quick Start Complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Copy .env.example to .env and add your API keys"
	@echo "  2. Run 'make dev' to start the development environment"
	@echo "  3. Open http://localhost:3000 to view the application"
	@echo ""
	@echo "Available commands:"
	@echo "  make help    - Show all available commands"
	@echo "  make dev     - Start development environment"
	@echo "  make test    - Run tests"
	@echo "  make docker-up - Start with Docker"
	@echo ""