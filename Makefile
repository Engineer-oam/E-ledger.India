# E-Ledger Blockchain Core Makefile

.PHONY: all rust-build rust-run go-build go-run clean help docker-build docker-up docker-down docker-dev docker-prod

help:
	@echo "E-Ledger Blockchain Core Makefile"
	@echo "Available targets:"
	@echo "  rust-build   - Build the Rust blockchain implementation"
	@echo "  rust-run     - Run the Rust blockchain implementation"
	@echo "  go-build     - Build the Go blockchain implementation"
	@echo "  go-run       - Run the Go blockchain implementation"
	@echo "  all          - Build both implementations"
	@echo "  clean        - Clean build artifacts"
	@echo ""
	@echo "Docker targets:"
	@echo "  docker-build - Build all Docker images"
	@echo "  docker-up    - Start production Docker containers"
	@echo "  docker-down  - Stop production Docker containers"
	@echo "  docker-dev   - Start development Docker containers"
	@echo "  docker-prod  - Start production Docker containers"

# Rust targets
rust-build:
	@echo "Building Rust blockchain implementation..."
	cd blockchain-engine/rust-core && cargo build --release

rust-run:
	@echo "Running Rust blockchain implementation..."
	cd blockchain-engine/rust-core && cargo run

# Go targets
go-build:
	@echo "Building Go blockchain implementation..."
	cd blockchain-engine/go-core && go build -o eledger-go-blockchain .

go-run:
	@echo "Running Go blockchain implementation..."
	cd blockchain-engine/go-core && go run *.go

# Combined targets
all: rust-build go-build

clean:
	@echo "Cleaning build artifacts..."
	rm -f blockchain-engine/go-core/eledger-go-blockchain
	@echo "Clean complete."

# Install dependencies
deps-go:
	@echo "Installing Go dependencies..."
	cd blockchain-engine/go-core && go mod tidy

deps-rust:
	@echo "Installing Rust dependencies..."
	cd blockchain-engine/rust-core && cargo check

deps: deps-go deps-rust

# Docker targets
docker-build:
	@echo "Building Docker images..."
	docker-compose build

docker-up:
	@echo "Starting production containers..."
	docker-compose up -d

docker-down:
	@echo "Stopping production containers..."
	docker-compose down

docker-dev:
	@echo "Starting development containers..."
	docker-compose -f docker-compose.dev.yml up

docker-prod:
	@echo "Starting production containers..."
	docker-compose up -d

# Docker cleanup
docker-clean:
	@echo "Cleaning Docker resources..."
	docker-compose down -v --remove-orphans
	docker system prune -f