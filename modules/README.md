# KubeStock Microservices Modules

This directory contains Git submodules for each microservice.

## Submodules

| Module | Description | Port |
|--------|-------------|------|
| `ms-product` | Product Catalog Service | 3002 |
| `ms-inventory` | Inventory Management Service | 3003 |
| `ms-supplier` | Supplier & Procurement Service | 3004 |
| `ms-order-management` | Order Management Service | 3005 |
| `ms-identity` | Identity/SCIM2 Proxy Service | 3006 |

## Initialize Submodules

```bash
# From the root of the repository
git submodule update --init --recursive
```

## Update All Submodules

```bash
git submodule update --remote --merge
```

## Add a New Submodule

```bash
git submodule add https://github.com/KubeStock-DevOps-project/ms-new-service.git modules/ms-new-service
```
