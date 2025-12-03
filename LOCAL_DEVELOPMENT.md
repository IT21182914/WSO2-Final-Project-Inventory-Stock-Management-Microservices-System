# KubeStock - Local Development Guide

This guide explains how to run the entire KubeStock microservices system locally for development and testing.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React/Vite)                         │
│                              localhost:5173                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       API Gateway (NGINX)                               │
│                           localhost:8080                                │
└─────────────────────────────────────────────────────────────────────────┘
        │              │              │              │              │
        ▼              ▼              ▼              ▼              ▼
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│ms-product │  │ms-inventory│  │ms-supplier│  │ ms-order  │  │ms-identity│
│   :3002   │  │   :3003   │  │   :3004   │  │   :3005   │  │   :3006   │
└───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   PostgreSQL :5432    │
                    │  (4 databases)        │
                    └───────────────────────┘
```

## Prerequisites

- **Docker** & **Docker Compose** v2.x+
- **Git** (for submodules)
- **Node.js** 18+ (for local development without Docker)

## Quick Start

### 1. Clone with Submodules

```bash
# Clone the repository
git clone https://github.com/KubeStock-DevOps-project/Dilan-WSO2-Final-Project-Inventory-Stock-Management-Microservices-System.git
cd Dilan-WSO2-Final-Project-Inventory-Stock-Management-Microservices-System

# Initialize and update submodules
git submodule update --init --recursive
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Asgardeo credentials
# Required values:
#   - ASGARDEO_SPA_CLIENT_ID
#   - ASGARDEO_CLIENT_ID
#   - ASGARDEO_M2M_CLIENT_ID
#   - ASGARDEO_M2M_CLIENT_SECRET
```

### 3. Start All Services

```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f

# Check service health
docker compose ps
```

### 4. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React SPA |
| API Gateway | http://localhost:8080 | NGINX reverse proxy |
| Product Service | http://localhost:3002 | Product catalog API |
| Inventory Service | http://localhost:3003 | Stock management API |
| Supplier Service | http://localhost:3004 | Supplier & PO API |
| Order Service | http://localhost:3005 | Order management API |
| Identity Service | http://localhost:3006 | User/Group SCIM2 API |
| PostgreSQL | localhost:5432 | Database |

## Submodules (Microservices)

The microservices are managed as Git submodules in the `modules/` directory:

| Module | Repository | Port |
|--------|------------|------|
| ms-product | [ms-product](https://github.com/KubeStock-DevOps-project/ms-product) | 3002 |
| ms-inventory | [ms-inventory](https://github.com/KubeStock-DevOps-project/ms-inventory) | 3003 |
| ms-supplier | [ms-supplier](https://github.com/KubeStock-DevOps-project/ms-supplier) | 3004 |
| ms-order-management | [ms-order-management](https://github.com/KubeStock-DevOps-project/ms-order-management) | 3005 |
| ms-identity | [ms-identity](https://github.com/KubeStock-DevOps-project/ms-identity) | 3006 |

### Updating Submodules

```bash
# Update all submodules to latest
git submodule update --remote --merge

# Update a specific submodule
cd modules/ms-product
git pull origin main
cd ../..
git add modules/ms-product
git commit -m "Update ms-product submodule"
```

## API Gateway Routes

The NGINX API Gateway routes requests to the appropriate microservice:

| Route | Service |
|-------|---------|
| `/api/products`, `/api/categories`, `/api/pricing` | ms-product |
| `/api/inventory`, `/api/stock`, `/api/alerts` | ms-inventory |
| `/api/suppliers`, `/api/purchase-orders`, `/api/purchase-requests` | ms-supplier |
| `/api/orders` | ms-order-management |
| `/api/users`, `/api/groups`, `/api/identity` | ms-identity |

## Common Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Rebuild a specific service
docker compose build ms-product
docker compose up -d ms-product

# View logs for a specific service
docker compose logs -f ms-product

# Reset everything (including database)
docker compose down -v
docker compose up -d

# Shell into a service container
docker compose exec ms-product sh

# Run database migrations manually
docker compose exec ms-product npm run migrate:up
```

## Asgardeo Configuration

You need three Asgardeo applications:

1. **SPA Application** (for Frontend)
   - Type: Single Page Application
   - Allowed Origins: `http://localhost:5173`
   - Callback URLs: `http://localhost:5173`

2. **Standard Application** (for Backend JWT validation)
   - Type: Standard-Based Application
   - Used by microservices to validate JWTs

3. **M2M Application** (for Identity Service)
   - Type: Machine-to-Machine
   - Scopes: `internal_user_mgt_view`, `internal_user_mgt_create`, `internal_user_mgt_update`, `internal_user_mgt_delete`, `internal_group_mgt_view`

## Troubleshooting

### Submodules Empty
```bash
git submodule update --init --recursive
```

### Database Connection Issues
```bash
# Wait for PostgreSQL to be healthy
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up -d postgres
docker compose up -d
```

### Service Won't Start
```bash
# Check logs
docker compose logs ms-product

# Rebuild image
docker compose build --no-cache ms-product
docker compose up -d ms-product
```

### Port Conflicts
If ports are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3102:3002"  # Use different host port
```

## Step 1: Start PostgreSQL

```bash
cd backend

# Start PostgreSQL only (databases will be initialized from init.sql)
docker-compose -f docker-compose.postgres.yml up -d

# Verify PostgreSQL is running
docker ps
# Should show: ims-postgres container

# Check logs if needed
docker logs ims-postgres
```

## Step 2: Run Database Migrations (if needed)

The `init.sql` script creates all tables automatically on first run. If you need to apply additional migrations:

```bash
# Connect to PostgreSQL and run migration scripts manually
docker exec -it ims-postgres psql -U postgres -d inventory_db -f /path/to/migration.sql
```

## Step 3: Install Dependencies

```bash
# Backend services (run in separate terminals or use a script)
cd backend/services/product-catalog-service && npm install
cd backend/services/inventory-service && npm install
cd backend/services/supplier-service && npm install
cd backend/services/order-service && npm install

# Frontend
cd frontend && npm install
```

## Step 4: Start Backend Services

Open **4 separate terminals** and run each service:

### Terminal 1: Product Catalog Service (Port 3002)
```bash
cd backend/services/product-catalog-service
npm run dev
```

### Terminal 2: Inventory Service (Port 3003)
```bash
cd backend/services/inventory-service
npm run dev
```

### Terminal 3: Supplier Service (Port 3004)
```bash
cd backend/services/supplier-service
npm run dev
```

### Terminal 4: Order Service (Port 3005)
```bash
cd backend/services/order-service
npm run dev
```

## Step 5: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:5173

## Step 6: Configure Asgardeo (First Time Setup)

1. Go to https://console.asgardeo.io
2. Create a Single Page Application (SPA)
3. Configure authorized redirect URLs:
   - Sign-in redirect: `http://localhost:5173`
   - Sign-out redirect: `http://localhost:5173`
4. Copy the Client ID
5. Update `frontend/.env`:
   ```
   VITE_ASGARDEO_BASE_URL=https://api.asgardeo.io/t/YOUR_ORG_NAME
   VITE_ASGARDEO_CLIENT_ID=YOUR_CLIENT_ID
   ```

## Verifying Everything Works

### Health Checks
```bash
curl http://localhost:3002/health  # Product Catalog
curl http://localhost:3003/health  # Inventory
curl http://localhost:3004/health  # Supplier
curl http://localhost:3005/health  # Order
```

### Frontend
Open http://localhost:5173 in your browser. You should see the login page.

## Stopping Services

```bash
# Stop PostgreSQL
cd backend
docker-compose -f docker-compose.postgres.yml down

# Stop each Node.js service with Ctrl+C in their respective terminals
```

## Environment Files

All `.env` files are pre-configured for localhost development:

| Service | Port | Database |
|---------|------|----------|
| Product Catalog | 3002 | product_catalog_db |
| Inventory | 3003 | inventory_db |
| Supplier | 3004 | supplier_db |
| Order | 3005 | order_db |
| Frontend | 5173 | N/A |
| PostgreSQL | 5432 | N/A |

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps

# Check PostgreSQL logs
docker logs ims-postgres

# Manually connect to verify
docker exec -it ims-postgres psql -U postgres -l
```

### Service Not Starting
- Check if the port is already in use
- Verify `.env` file exists in the service directory
- Check for missing dependencies: `npm install`

### Frontend Not Connecting to Backend
- Ensure all backend services are running
- Check CORS is enabled (it is by default)
- Verify service URLs in `frontend/.env`
