# Deprecated: Modules Directory

⚠️ **This directory is deprecated and will be removed in a future release.**

## Migration Notice

All microservices have been migrated from git submodules to a monorepo structure:

- **Old location**: `modules/ms-*` (git submodules)
- **New location**: `services/ms-*` (regular directories)

## Services Moved

The following services are now in the `services/` directory:
- `ms-product` → Product Catalog Service
- `ms-inventory` → Inventory Management Service  
- `ms-supplier` → Supplier Service
- `ms-order-management` → Order Management Service
- `ms-identity` → Identity Service (SCIM2 Proxy)

## Frontend Migration

- **Old location**: `frontend/` (git submodule)
- **New location**: `apps/web/` (regular directory)

## Benefits of Monorepo

1. **Simplified Development**: No more git submodule complexity
2. **Unified CI/CD**: Single workflow with change detection
3. **Shared Dependencies**: Common packages in `packages/` directory
4. **Turborepo**: Optimized builds with caching
5. **Easier Collaboration**: All code in one repository

See `MONOREPO.md` in the root directory for complete documentation.
