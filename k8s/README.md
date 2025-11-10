# Kubernetes Manifests for Inventory Stock Management System

## 📋 Overview

This directory contains all Kubernetes manifests for deploying the Inventory Stock Management System in a production-ready, Zero Trust environment.

## 🗂️ Directory Structure

```
k8s/
├── base/                          # Base Kubernetes resources
│   ├── namespaces/               # Namespace definitions
│   │   └── inventory-system.yaml
│   ├── services/                 # Microservices
│   │   ├── user-service/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   ├── hpa.yaml
│   │   │   ├── servicemonitor.yaml
│   │   │   ├── networkpolicy.yaml
│   │   │   └── serviceaccount.yaml
│   │   ├── product-catalog-service/
│   │   ├── inventory-service/
│   │   ├── order-service/
│   │   └── supplier-service/
│   ├── gateway/                  # API Gateway (Kong)
│   ├── database/                 # PostgreSQL StatefulSet
│   └── ingress/                  # Ingress controller config
├── monitoring/                    # Prometheus + Grafana
│   ├── namespace.yaml
│   ├── prometheus/
│   ├── grafana/
│   ├── node-exporter/
│   └── kube-state-metrics/
├── logging/                       # OpenSearch + Fluent Bit
│   ├── namespace.yaml
│   ├── opensearch/
│   ├── opensearch-dashboards/
│   └── fluent-bit/
├── security/                      # Zero Trust Components
│   ├── namespace.yaml
│   ├── falco/                    # Runtime security
│   ├── opa-gatekeeper/           # Policy enforcement
│   ├── vault/                    # Secrets management
│   └── pod-security-policies/
└── argocd/                        # GitOps
    ├── namespace.yaml
    ├── argocd-install.yaml
    └── applications/
```

## ✅ Implementation Status

### Base Infrastructure
- [x] Namespaces with Pod Security Standards
- [x] Default deny-all Network Policy
- [x] User Service (Complete: Deployment, Service, HPA, ServiceMonitor, NetworkPolicy, ServiceAccount)
- [ ] Product Catalog Service
- [ ] Inventory Service
- [ ] Order Service
- [ ] Supplier Service
- [ ] API Gateway (Kong)
- [ ] PostgreSQL StatefulSet
- [ ] Ingress Controller

### Monitoring Stack
- [ ] Prometheus Operator
- [ ] Prometheus Instance
- [ ] Grafana
- [ ] AlertManager
- [ ] Node Exporter
- [ ] Kube State Metrics
- [ ] ServiceMonitors for all services

### Logging Stack
- [ ] OpenSearch Cluster
- [ ] OpenSearch Dashboards
- [ ] Fluent Bit DaemonSet

### Security (Zero Trust)
- [ ] Falco (Runtime Security)
- [ ] OPA Gatekeeper (Policy Enforcement)
- [ ] HashiCorp Vault (Secrets Management)
- [ ] Service Mesh (Istio/Linkerd)
- [ ] Network Policies (All services)

### GitOps
- [ ] ArgoCD Installation
- [ ] ArgoCD Applications for Staging
- [ ] ArgoCD Applications for Production

## 🚀 Deployment Instructions

### Prerequisites

1. **Kubernetes Cluster**: Self-managed (kubeadm/k3s), NOT EKS/AKS
2. **kubectl**: v1.28+
3. **kustomize**: v5.0+
4. **Helm**: v3.12+ (for some components)

### Quick Start

```bash
# 1. Create namespaces
kubectl apply -f base/namespaces/

# 2. Create secrets (using Vault in production)
kubectl create secret generic postgres-secret \
  --from-literal=host=postgres.inventory-system.svc.cluster.local \
  --from-literal=username=postgres \
  --from-literal=password=YOUR_PASSWORD \
  -n inventory-system

kubectl create secret generic jwt-secret \
  --from-literal=secret=YOUR_JWT_SECRET \
  -n inventory-system

# 3. Deploy database
kubectl apply -f base/database/

# 4. Deploy services
kubectl apply -f base/services/user-service/
kubectl apply -f base/services/product-catalog-service/
kubectl apply -f base/services/inventory-service/
kubectl apply -f base/services/order-service/
kubectl apply -f base/services/supplier-service/

# 5. Deploy API Gateway
kubectl apply -f base/gateway/

# 6. Deploy Ingress
kubectl apply -f base/ingress/

# 7. Deploy monitoring
kubectl apply -f monitoring/

# 8. Deploy logging
kubectl apply -f logging/

# 9. Deploy security components
kubectl apply -f security/
```

### Verification

```bash
# Check all pods are running
kubectl get pods -n inventory-system

# Check services
kubectl get svc -n inventory-system

# Check HPA status
kubectl get hpa -n inventory-system

# Check network policies
kubectl get networkpolicies -n inventory-system

# View logs
kubectl logs -f deployment/user-service -n inventory-system

# Check metrics
kubectl top pods -n inventory-system
```

## 🔒 Zero Trust Security Features

### 1. Pod Security Standards
All namespaces enforce `restricted` Pod Security Standards:
- Run as non-root
- No privileged containers
- Drop all capabilities
- Read-only root filesystem

### 2. Network Policies
- Default deny-all policy
- Explicit allow rules for each service
- Service-to-service communication controlled
- DNS and external access restricted

### 3. RBAC
- Dedicated ServiceAccount per microservice
- Minimal permissions (least privilege)
- No default ServiceAccount usage

### 4. Secrets Management
- Secrets stored in HashiCorp Vault
- No secrets in code or ConfigMaps
- Dynamic secret generation
- Automatic rotation

### 5. Service Mesh
- mTLS between all services
- Certificate-based authentication
- Traffic encryption end-to-end

## 📊 Auto-Scaling Configuration

### Horizontal Pod Autoscaler (HPA)
Each service configured to scale based on:
- CPU utilization (70% threshold)
- Memory utilization (80% threshold)
- Custom metrics: HTTP requests per second (1000 req/s)

**Scaling Parameters:**
- Min replicas: 2 (high availability)
- Max replicas: 10 (handle traffic spikes)
- Scale-up: Immediate (aggressive)
- Scale-down: 5-minute stabilization (conservative)

### Example Scaling Behavior

```yaml
# When load increases
CPU > 70% → Add pods immediately (up to 100% increase)

# When load decreases
CPU < 70% for 5 minutes → Remove pods gradually (max 50% decrease)
```

## 📈 Monitoring & Observability

### Prometheus Metrics Collected
- HTTP request duration (histogram)
- HTTP request count (counter)
- Error rate by status code
- Active connections
- Database connection pool
- Node resources (CPU, memory, disk)
- Pod resources
- Custom business metrics

### Grafana Dashboards
1. **Cluster Overview**: Node health, resource usage
2. **Microservices Dashboard**: Request rate, error rate, latency
3. **Business Metrics**: Orders, inventory levels, user activity
4. **Database Performance**: Query performance, connections

### Alerts Configured
- High error rate (>5% for 5 minutes)
- Service down (>1 minute)
- High latency (p95 >1s for 5 minutes)
- High memory usage (>90% for 5 minutes)
- Pod crash looping

## 🪵 Logging with OpenSearch

### Log Collection
- **Fluent Bit** DaemonSet on every node
- Collects logs from:
  - Application containers
  - System containers
  - Kubernetes audit logs

### Log Storage
- **OpenSearch** cluster (3 nodes)
- Retention: 30 days
- Index per day for efficient querying

### Log Access
- **OpenSearch Dashboards** for visualization
- Pre-configured dashboards for:
  - Application logs
  - Error tracking
  - Audit logs
  - Security events

## 🔧 Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n inventory-system
kubectl logs <pod-name> -n inventory-system
```

**Network connectivity issues:**
```bash
# Test service connectivity
kubectl run -it --rm debug --image=alpine --restart=Never -n inventory-system -- /bin/sh
# Inside the pod:
wget -O- http://user-service/health
```

**HPA not scaling:**
```bash
# Check metrics server
kubectl top nodes
kubectl top pods -n inventory-system

# Check HPA status
kubectl describe hpa user-service-hpa -n inventory-system
```

**Database connection issues:**
```bash
# Check postgres pod
kubectl get pods -n inventory-system -l app=postgres

# Check secrets
kubectl get secret postgres-secret -n inventory-system -o yaml
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [OpenSearch Documentation](https://opensearch.org/docs/)
- [OPA Gatekeeper](https://open-policy-agent.github.io/gatekeeper/)
- [Falco Security](https://falco.org/docs/)

## 🆘 Support

For issues or questions:
1. Check the [Troubleshooting Guide](../docs/TROUBLESHOOTING_GUIDE.md)
2. Review logs in OpenSearch Dashboards
3. Check Grafana dashboards for metrics
4. Contact DevOps team

---

**Last Updated**: November 2025  
**Status**: ✅ User Service Complete | 🚧 Other Services In Progress
