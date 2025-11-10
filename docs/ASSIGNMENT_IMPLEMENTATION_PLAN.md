# Production-Ready Inventory & Stock Management System
## Complete Implementation Guide for Assignment Requirements

---

## 📋 Assignment Compliance Checklist

### ✅ Required Microservices
- [x] User Service (Authentication, profiles, roles)
- [x] Product Catalog Service (SKU, variants)
- [x] Inventory Service (Real-time stock tracking)
- [x] Supplier & Procurement Service (PO, vendors)
- [x] Order Management Service (Sales sync, deductions)

### ✅ CI/CD Pipeline Stages (6 Stages)
- [ ] Stage 1: GitHub monitoring & trigger
- [ ] Stage 2: Build & Containerize
- [ ] Stage 3: Security & Compliance Scans
- [ ] Stage 4: Deploy to Staging (ArgoCD + Smoke Tests)
- [ ] Stage 5: Manual Approval for Production
- [ ] Stage 6: Production Deployment (Canary/Blue-Green)

### ✅ Infrastructure Requirements
- [ ] Kubernetes deployment (Self-managed, NOT EKS/AKS)
- [ ] Zero Trust Security implementation
- [ ] Auto-scaling based on traffic
- [ ] Prometheus monitoring (Infrastructure + Application)
- [ ] OpenSearch stack for log management
- [ ] GitOps with ArgoCD

### ✅ Deliverables
- [ ] Complete source code (Git repositories)
- [ ] Terraform scripts
- [ ] CI/CD pipeline configuration
- [ ] Deployment guide documentation
- [ ] Architecture justification
- [ ] Presentation materials

---

## 🏗️ Production Architecture (Zero Trust - No Cloud Vendor Lock-in)

```
┌────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL LAYER (On-Premise/VM)                   │
│  - NGINX Ingress Controller (TLS Termination)                      │
│  - cert-manager (Let's Encrypt SSL)                                │
│  - External DNS (if needed)                                         │
└─────────────────────────┬──────────────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────────────┐
│                 KUBERNETES CLUSTER (Self-Managed)                   │
│                     (kubeadm / k3s / RKE2)                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              ZERO TRUST SECURITY LAYER                        │ │
│  │  - Network Policies (Calico/Cilium)                          │ │
│  │  - Pod Security Standards (restricted)                       │ │
│  │  - OPA/Gatekeeper (Policy Enforcement)                       │ │
│  │  - Falco (Runtime Security)                                  │ │
│  │  - mTLS between all services (Service Mesh)                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              API GATEWAY (Kong / NGINX)                       │ │
│  │  - Authentication (JWT validation)                            │ │
│  │  - Rate Limiting (per user/IP)                               │ │
│  │  - Request Routing                                            │ │
│  │  - API Versioning                                             │ │
│  └────────────┬─────────────────────────────────────────────────┘ │
│               │                                                     │
│  ┌────────────┴────────────────────────────────────────────────┐  │
│  │              SERVICE MESH (Istio / Linkerd)                  │  │
│  │  - mTLS between services (Zero Trust)                       │  │
│  │  - Traffic management                                        │  │
│  │  - Circuit Breaking                                          │  │
│  │  - Retry logic                                               │  │
│  │  - Distributed tracing                                       │  │
│  └────────────┬────────────────────────────────────────────────┘  │
│               │                                                     │
│  ┌────────────┴────────────────────────────────────────────────┐  │
│  │              MICROSERVICES (Namespaces)                      │  │
│  │                                                              │  │
│  │  Namespace: inventory-system                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │  User    │  │ Product  │  │Inventory │  │  Order   │   │  │
│  │  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │  │
│  │  │(HPA 2-10)│  │(HPA 2-10)│  │(HPA 2-10)│  │(HPA 2-10)│   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  │  ┌──────────┐                                              │  │
│  │  │Supplier  │                                              │  │
│  │  │ Service  │                                              │  │
│  │  │(HPA 2-10)│                                              │  │
│  │  └──────────┘                                              │  │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              DATA LAYER (StatefulSet)                        │ │
│  │  - PostgreSQL (StatefulSet with PV)                         │ │
│  │  - Redis (StatefulSet for caching)                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │         OBSERVABILITY (Namespace: monitoring)                │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │  Prometheus  │  │   Grafana    │  │ AlertManager │     │ │
│  │  │   + Node     │  │ (Dashboards) │  │   (Alerts)   │     │ │
│  │  │   Exporter   │  │              │  │              │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │         LOGGING (Namespace: logging)                  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐       │  │
│  │  │  │OpenSearch│  │Fluentd/  │  │  OpenSearch  │       │  │
│  │  │  │  Cluster │  │ Fluent   │  │  Dashboards  │       │  │
│  │  │  │          │  │   Bit    │  │              │       │  │
│  │  │  └──────────┘  └──────────┘  └──────────────┘       │  │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              GITOPS (Namespace: argocd)                      │ │
│  │  - ArgoCD (GitOps operator)                                 │ │
│  │  - Auto-sync from Git repos                                 │ │
│  │  - Self-healing                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │         SECURITY TOOLS (Namespace: security)                 │ │
│  │  - Falco (Runtime threat detection)                         │ │
│  │  - OPA Gatekeeper (Policy enforcement)                      │ │
│  │  - Vault (Secrets management)                                │ │
│  │  - Trivy Operator (Vulnerability scanning)                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                 CI/CD PIPELINE (GitHub Actions)                      │
│  Stage 1: Monitor & Trigger                                         │
│  Stage 2: Build & Containerize                                      │
│  Stage 3: Security Scans (Trivy, Snyk, OWASP)                      │
│  Stage 4: Deploy to Staging + Smoke Tests                          │
│  Stage 5: Manual Approval                                           │
│  Stage 6: Production Deploy (Canary/Blue-Green)                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE AS CODE (Terraform/Ansible)              │
│  - VM provisioning                                                  │
│  - K8s cluster setup (kubeadm/k3s)                                 │
│  - Network configuration                                            │
│  - Storage provisioning                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Zero Trust Security Implementation

### Principle: "Never Trust, Always Verify"

#### 1. Network Segmentation
```yaml
# Deny all traffic by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: inventory-system
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

#### 2. Mutual TLS (mTLS) Between Services
- All service-to-service communication encrypted
- Certificate-based authentication
- Implemented via Service Mesh (Istio/Linkerd)

#### 3. Pod Security Standards
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: inventory-system
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

#### 4. RBAC (Role-Based Access Control)
```yaml
# Least privilege principle
- Separate service accounts per microservice
- Minimal permissions
- No default service account usage
```

#### 5. Secrets Management with Vault
```yaml
# No secrets in code or ConfigMaps
# All secrets stored in HashiCorp Vault
# Dynamic secrets generation
# Automatic rotation
```

#### 6. Runtime Security with Falco
```yaml
# Monitor for:
- Unexpected system calls
- Privilege escalation attempts
- Container escapes
- Suspicious file access
```

#### 7. Policy Enforcement with OPA Gatekeeper
```yaml
# Enforce policies:
- No privileged containers
- Required labels
- Resource limits
- Allowed registries
- Image signature verification
```

---

## 📦 Complete Project Structure

```
inventory-stock-management-system/
│
├── .github/
│   └── workflows/
│       ├── ci-cd-staging.yml          # Stage 1-4
│       ├── ci-cd-production.yml       # Stage 5-6
│       ├── security-scan.yml          # Stage 3
│       └── smoke-tests.yml            # Stage 4
│
├── backend/
│   ├── services/
│   │   ├── user-service/
│   │   ├── product-catalog-service/
│   │   ├── inventory-service/
│   │   ├── order-service/
│   │   └── supplier-service/
│   ├── docker-compose.yml
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── infrastructure/
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── vm/                    # VM provisioning
│   │   │   ├── network/               # Network setup
│   │   │   └── storage/               # Storage setup
│   │   ├── environments/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── main.tf
│   │
│   └── ansible/
│       ├── playbooks/
│       │   ├── k8s-cluster-setup.yml  # kubeadm/k3s installation
│       │   ├── monitoring-setup.yml   # Prometheus installation
│       │   ├── logging-setup.yml      # OpenSearch installation
│       │   └── security-setup.yml     # Falco, OPA, Vault
│       ├── inventory/
│       │   ├── staging.ini
│       │   └── production.ini
│       └── roles/
│           ├── k8s-master/
│           ├── k8s-worker/
│           ├── prometheus/
│           ├── opensearch/
│           └── argocd/
│
├── k8s/
│   ├── base/                          # Base Kubernetes manifests
│   │   ├── namespaces/
│   │   ├── networkpolicies/
│   │   ├── rbac/
│   │   ├── services/
│   │   │   ├── user-service/
│   │   │   │   ├── deployment.yaml
│   │   │   │   ├── service.yaml
│   │   │   │   ├── hpa.yaml
│   │   │   │   ├── servicemonitor.yaml
│   │   │   │   ├── networkpolicy.yaml
│   │   │   │   └── serviceaccount.yaml
│   │   │   ├── product-service/
│   │   │   ├── inventory-service/
│   │   │   ├── order-service/
│   │   │   └── supplier-service/
│   │   ├── gateway/
│   │   │   └── kong/
│   │   ├── database/
│   │   │   ├── postgres-statefulset.yaml
│   │   │   ├── postgres-service.yaml
│   │   │   └── postgres-pvc.yaml
│   │   └── ingress/
│   │       └── nginx-ingress.yaml
│   │
│   ├── overlays/
│   │   ├── staging/
│   │   │   └── kustomization.yaml
│   │   └── production/
│   │       └── kustomization.yaml
│   │
│   ├── monitoring/                    # Prometheus + Grafana
│   │   ├── namespace.yaml
│   │   ├── prometheus/
│   │   │   ├── prometheus-operator.yaml
│   │   │   ├── prometheus-instance.yaml
│   │   │   ├── servicemonitors.yaml
│   │   │   └── alertrules.yaml
│   │   ├── grafana/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   ├── dashboards/
│   │   │   │   ├── cluster-overview.json
│   │   │   │   ├── microservices-dashboard.json
│   │   │   │   └── business-metrics.json
│   │   │   └── datasources.yaml
│   │   ├── node-exporter/
│   │   └── kube-state-metrics/
│   │
│   ├── logging/                       # OpenSearch Stack
│   │   ├── namespace.yaml
│   │   ├── opensearch/
│   │   │   ├── statefulset.yaml
│   │   │   ├── service.yaml
│   │   │   └── pvc.yaml
│   │   ├── opensearch-dashboards/
│   │   │   ├── deployment.yaml
│   │   │   └── service.yaml
│   │   └── fluent-bit/
│   │       ├── daemonset.yaml
│   │       └── configmap.yaml
│   │
│   ├── security/                      # Zero Trust Components
│   │   ├── namespace.yaml
│   │   ├── falco/
│   │   │   ├── daemonset.yaml
│   │   │   └── rules.yaml
│   │   ├── opa-gatekeeper/
│   │   │   ├── gatekeeper-operator.yaml
│   │   │   └── constraints/
│   │   │       ├── pod-security.yaml
│   │   │       ├── required-labels.yaml
│   │   │       └── allowed-repos.yaml
│   │   ├── vault/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── config.yaml
│   │   ├── trivy-operator/
│   │   │   └── operator.yaml
│   │   └── pod-security-policies/
│   │
│   ├── argocd/                        # GitOps
│   │   ├── namespace.yaml
│   │   ├── argocd-install.yaml
│   │   ├── applications/
│   │   │   ├── inventory-system-staging.yaml
│   │   │   └── inventory-system-production.yaml
│   │   └── projects/
│   │
│   └── service-mesh/                  # Istio/Linkerd
│       ├── istio-operator.yaml
│       ├── gateway.yaml
│       ├── virtualservices/
│       └── destinationrules/
│
├── gitops-repo/                       # Separate GitOps repository
│   ├── staging/
│   │   └── inventory-system/
│   │       └── kustomization.yaml
│   └── production/
│       └── inventory-system/
│           └── kustomization.yaml
│
├── scripts/
│   ├── deploy/
│   │   ├── deploy-staging.sh
│   │   └── deploy-production.sh
│   ├── smoke-tests/
│   │   ├── test-user-service.sh
│   │   ├── test-product-service.sh
│   │   ├── test-inventory-service.sh
│   │   ├── test-order-service.sh
│   │   └── test-supplier-service.sh
│   └── rollback/
│       └── rollback-deployment.sh
│
├── docs/
│   ├── DEPLOYMENT_GUIDE.md            # Required deliverable
│   ├── ARCHITECTURE_JUSTIFICATION.md  # Required deliverable
│   ├── ZERO_TRUST_IMPLEMENTATION.md
│   ├── CI_CD_PIPELINE_GUIDE.md
│   ├── MONITORING_GUIDE.md
│   └── TROUBLESHOOTING_GUIDE.md
│
├── tests/
│   ├── integration/
│   ├── e2e/
│   └── smoke/
│
└── README.md
```

---

## 🚀 CI/CD Pipeline Implementation (6 Stages)

### Stage 1: Monitor GitHub & Trigger

```yaml
# .github/workflows/ci-cd-staging.yml
name: CI/CD Pipeline - Staging

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  stage-1-trigger:
    name: "Stage 1: Monitor & Trigger"
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Detect changes
        id: changes
        run: |
          echo "user_service=$(git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep 'backend/services/user-service' | wc -l)" >> $GITHUB_OUTPUT
          echo "product_service=$(git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep 'backend/services/product-catalog-service' | wc -l)" >> $GITHUB_OUTPUT
          echo "inventory_service=$(git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep 'backend/services/inventory-service' | wc -l)" >> $GITHUB_OUTPUT
          echo "order_service=$(git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep 'backend/services/order-service' | wc -l)" >> $GITHUB_OUTPUT
          echo "supplier_service=$(git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep 'backend/services/supplier-service' | wc -l)" >> $GITHUB_OUTPUT
          echo "frontend=$(git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep 'frontend' | wc -l)" >> $GITHUB_OUTPUT
      
      - name: Notify pipeline start
        run: |
          echo "🚀 CI/CD Pipeline triggered by ${{ github.actor }}"
          echo "📝 Commit: ${{ github.event.head_commit.message }}"
    
    outputs:
      user_service_changed: ${{ steps.changes.outputs.user_service }}
      product_service_changed: ${{ steps.changes.outputs.product_service }}
      inventory_service_changed: ${{ steps.changes.outputs.inventory_service }}
      order_service_changed: ${{ steps.changes.outputs.order_service }}
      supplier_service_changed: ${{ steps.changes.outputs.supplier_service }}
      frontend_changed: ${{ steps.changes.outputs.frontend }}
```

### Stage 2: Build & Containerize

```yaml
  stage-2-build:
    name: "Stage 2: Build & Containerize"
    needs: stage-1-trigger
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - name: user-service
            context: ./backend/services/user-service
            changed: ${{ needs.stage-1-trigger.outputs.user_service_changed }}
          - name: product-catalog-service
            context: ./backend/services/product-catalog-service
            changed: ${{ needs.stage-1-trigger.outputs.product_service_changed }}
          - name: inventory-service
            context: ./backend/services/inventory-service
            changed: ${{ needs.stage-1-trigger.outputs.inventory_service_changed }}
          - name: order-service
            context: ./backend/services/order-service
            changed: ${{ needs.stage-1-trigger.outputs.order_service_changed }}
          - name: supplier-service
            context: ./backend/services/supplier-service
            changed: ${{ needs.stage-1-trigger.outputs.supplier_service_changed }}
          - name: frontend
            context: ./frontend
            changed: ${{ needs.stage-1-trigger.outputs.frontend_changed }}
    
    steps:
      - name: Checkout code
        if: matrix.service.changed != '0'
        uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        if: matrix.service.changed != '0'
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        if: matrix.service.changed != '0'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        if: matrix.service.changed != '0'
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service.name }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}
      
      - name: Build and push Docker image
        if: matrix.service.changed != '0'
        uses: docker/build-push-action@v5
        with:
          context: ${{ matrix.service.context }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}
```

### Stage 3: Security & Compliance Scans

```yaml
  stage-3-security-scan:
    name: "Stage 3: Security Scans"
    needs: stage-2-build
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [user-service, product-catalog-service, inventory-service, order-service, supplier-service, frontend]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results-${{ matrix.service }}.sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'  # Fail on CRITICAL/HIGH vulnerabilities
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results-${{ matrix.service }}.sarif'
      
      - name: Run Snyk security scan
        uses: snyk/actions/docker@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          image: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service }}:${{ github.sha }}
          args: --severity-threshold=high --fail-on=all
      
      - name: OWASP Dependency Check
        if: contains(matrix.service, 'service') # Only for backend services
        run: |
          docker run --rm -v $(pwd)/${{ matrix.service }}:/src \
            owasp/dependency-check:latest \
            --scan /src \
            --format JSON \
            --out /src/dependency-check-report.json \
            --failOnCVSS 7
      
      - name: Check for secrets in code
        uses: trufflesecurity/trufflehog@main
        with:
          path: ${{ matrix.service }}
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
      
      - name: Notify on security failure
        if: failure()
        run: |
          echo "🚨 SECURITY SCAN FAILED for ${{ matrix.service }}"
          echo "Major vulnerabilities detected. Pipeline stopped."
          exit 1
```

### Stage 4: Deploy to Staging + Smoke Tests

```yaml
  stage-4-deploy-staging:
    name: "Stage 4: Deploy to Staging"
    needs: stage-3-security-scan
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Checkout GitOps repo
        uses: actions/checkout@v4
        with:
          repository: ${{ github.repository }}-gitops
          token: ${{ secrets.GITOPS_TOKEN }}
          path: gitops
      
      - name: Update Kubernetes manifests
        run: |
          cd gitops/staging/inventory-system
          
          # Update image tags in kustomization.yaml
          kustomize edit set image \
            user-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/user-service:${{ github.sha }} \
            product-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/product-catalog-service:${{ github.sha }} \
            inventory-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/inventory-service:${{ github.sha }} \
            order-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/order-service:${{ github.sha }} \
            supplier-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/supplier-service:${{ github.sha }} \
            frontend=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/frontend:${{ github.sha }}
      
      - name: Commit and push changes
        run: |
          cd gitops
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .
          git commit -m "Deploy to staging: ${{ github.sha }}"
          git push
      
      - name: Wait for ArgoCD sync
        run: |
          echo "Waiting for ArgoCD to sync changes..."
          sleep 60
          
          # Check ArgoCD application status
          argocd app wait inventory-system-staging \
            --health \
            --timeout 600
      
      - name: Run smoke tests
        run: |
          chmod +x ./scripts/smoke-tests/*.sh
          
          echo "🧪 Running smoke tests on staging..."
          
          # Test each service
          ./scripts/smoke-tests/test-user-service.sh staging
          ./scripts/smoke-tests/test-product-service.sh staging
          ./scripts/smoke-tests/test-inventory-service.sh staging
          ./scripts/smoke-tests/test-order-service.sh staging
          ./scripts/smoke-tests/test-supplier-service.sh staging
          
          echo "✅ All smoke tests passed!"
      
      - name: Verify deployment health
        run: |
          kubectl --namespace=inventory-system get pods
          kubectl --namespace=inventory-system get services
          
          # Check all pods are running
          PENDING=$(kubectl --namespace=inventory-system get pods --field-selector=status.phase!=Running --no-headers | wc -l)
          if [ "$PENDING" -gt 0 ]; then
            echo "❌ Some pods are not running"
            exit 1
          fi
      
      - name: Notify staging deployment success
        run: |
          echo "✅ Staging deployment successful!"
          echo "🔗 Staging URL: https://staging.inventory-system.example.com"
```

### Stage 5: Manual Approval for Production

```yaml
# .github/workflows/ci-cd-production.yml
name: CI/CD Pipeline - Production

on:
  workflow_run:
    workflows: ["CI/CD Pipeline - Staging"]
    types: [completed]
    branches: [main]

jobs:
  stage-5-manual-approval:
    name: "Stage 5: Manual Approval"
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    environment:
      name: production-approval
      url: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}
    
    steps:
      - name: Request approval
        run: |
          echo "⏳ Waiting for manual approval to deploy to production..."
          echo "Staging tests passed successfully"
          echo "Commit: ${{ github.sha }}"
      
      - name: Approval granted
        run: |
          echo "✅ Production deployment approved!"
```

### Stage 6: Production Deployment (Canary)

```yaml
  stage-6-production-deploy:
    name: "Stage 6: Production Deployment (Canary)"
    needs: stage-5-manual-approval
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout GitOps repo
        uses: actions/checkout@v4
        with:
          repository: ${{ github.repository }}-gitops
          token: ${{ secrets.GITOPS_TOKEN }}
          path: gitops
      
      - name: Deploy Canary (10% traffic)
        run: |
          cd gitops/production/inventory-system
          
          # Create canary deployment
          kustomize edit set image \
            user-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/user-service:${{ github.sha }}
          
          # Update VirtualService for 10% traffic to canary
          yq eval '.spec.http[0].route[0].weight = 90' -i virtualservice-user.yaml
          yq eval '.spec.http[0].route[1].weight = 10' -i virtualservice-user.yaml
          
          git add .
          git commit -m "Canary deployment: 10% traffic to ${{ github.sha }}"
          git push
          
          echo "🐤 Canary deployed with 10% traffic"
      
      - name: Monitor canary metrics
        run: |
          echo "📊 Monitoring canary metrics for 5 minutes..."
          
          # Query Prometheus for error rate
          for i in {1..5}; do
            ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~'5..',version='canary'}[1m])" | jq '.data.result[0].value[1]')
            
            if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
              echo "❌ Canary error rate too high: $ERROR_RATE"
              echo "🔄 Rolling back..."
              ./scripts/rollback/rollback-deployment.sh production
              exit 1
            fi
            
            echo "✅ Canary healthy. Error rate: $ERROR_RATE"
            sleep 60
          done
      
      - name: Increase canary traffic to 50%
        run: |
          cd gitops/production/inventory-system
          
          yq eval '.spec.http[0].route[0].weight = 50' -i virtualservice-user.yaml
          yq eval '.spec.http[0].route[1].weight = 50' -i virtualservice-user.yaml
          
          git add .
          git commit -m "Canary: 50% traffic to ${{ github.sha }}"
          git push
          
          echo "🐤 Canary traffic increased to 50%"
          sleep 180  # Monitor for 3 minutes
      
      - name: Complete canary rollout
        run: |
          cd gitops/production/inventory-system
          
          # Update all services to new version
          kustomize edit set image \
            user-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/user-service:${{ github.sha }} \
            product-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/product-catalog-service:${{ github.sha }} \
            inventory-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/inventory-service:${{ github.sha }} \
            order-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/order-service:${{ github.sha }} \
            supplier-service=${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/supplier-service:${{ github.sha }}
          
          # Set 100% traffic to new version
          yq eval '.spec.http[0].route[0].weight = 100' -i virtualservice-*.yaml
          yq eval '.spec.http[0].route[1].weight = 0' -i virtualservice-*.yaml
          
          git add .
          git commit -m "Production deployment complete: ${{ github.sha }}"
          git push
          
          echo "🚀 Production deployment complete!"
      
      - name: Verify production health
        run: |
          argocd app wait inventory-system-production --health --timeout 600
          
          # Run production smoke tests
          ./scripts/smoke-tests/test-user-service.sh production
          ./scripts/smoke-tests/test-product-service.sh production
          
          echo "✅ Production deployment verified!"
      
      - name: Automatic rollback on failure
        if: failure()
        run: |
          echo "🚨 Production deployment failed!"
          echo "🔄 Initiating automatic rollback..."
          
          ./scripts/rollback/rollback-deployment.sh production
          
          # Notify team
          echo "❌ Production deployment rolled back to previous version"
      
      - name: Notify deployment success
        if: success()
        run: |
          echo "🎉 Production deployment successful!"
          echo "📊 Version: ${{ github.sha }}"
          echo "🔗 Production URL: https://inventory-system.example.com"
```

---

## ⚙️ Auto-Scaling Configuration

### Horizontal Pod Autoscaler (HPA)

```yaml
# k8s/base/services/user-service/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: inventory-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  # Scale based on CPU usage
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  
  # Scale based on memory usage
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  
  # Scale based on request count (custom metric from Prometheus)
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
      - type: Percent
        value: 50  # Scale down max 50% at a time
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0  # Scale up immediately
      policies:
      - type: Percent
        value: 100  # Can double pods if needed
        periodSeconds: 15
      - type: Pods
        value: 4  # Or add 4 pods at once
        periodSeconds: 15
      selectPolicy: Max  # Use the policy that scales most
```

### Cluster Autoscaler (Node-level)

```yaml
# k8s/base/cluster-autoscaler.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
    spec:
      serviceAccountName: cluster-autoscaler
      containers:
      - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.28.0
        name: cluster-autoscaler
        command:
          - ./cluster-autoscaler
          - --v=4
          - --stderrthreshold=info
          - --cloud-provider=clusterapi  # For self-managed K8s
          - --nodes=2:10:worker-pool-1   # Min 2, Max 10 nodes
          - --scale-down-enabled=true
          - --scale-down-delay-after-add=10m
          - --scale-down-unneeded-time=10m
```

---

## 📊 Prometheus Monitoring Implementation

### ServiceMonitor for Each Microservice

```yaml
# k8s/base/services/user-service/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: user-service-monitor
  namespace: inventory-system
  labels:
    app: user-service
    prometheus: inventory
spec:
  selector:
    matchLabels:
      app: user-service
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
```

### Prometheus Alert Rules

```yaml
# k8s/monitoring/prometheus/alertrules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: inventory-system-alerts
  namespace: monitoring
spec:
  groups:
  - name: inventory-system
    interval: 30s
    rules:
    # High error rate
    - alert: HighErrorRate
      expr: |
        rate(http_requests_total{status=~"5.."}[5m]) > 0.05
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "{{ $labels.service }} has error rate of {{ $value }}"
    
    # Service down
    - alert: ServiceDown
      expr: up{job=~".*-service"} == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Service is down"
        description: "{{ $labels.job }} has been down for more than 1 minute"
    
    # High response time
    - alert: HighLatency
      expr: |
        histogram_quantile(0.95, 
          rate(http_request_duration_seconds_bucket[5m])
        ) > 1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High latency detected"
        description: "{{ $labels.service }} p95 latency is {{ $value }}s"
    
    # Pod memory usage
    - alert: HighMemoryUsage
      expr: |
        container_memory_usage_bytes{namespace="inventory-system"} 
        / container_spec_memory_limit_bytes{namespace="inventory-system"} 
        > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage"
        description: "{{ $labels.pod }} is using {{ $value }}% memory"
    
    # Database connections
    - alert: HighDatabaseConnections
      expr: pg_stat_database_numbackends > 80
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High database connection count"
```

### Grafana Dashboards (JSON configs)

Will be created in separate files for:
- Cluster Overview Dashboard
- Microservices Performance Dashboard
- Business Metrics Dashboard
- Database Performance Dashboard

---

## 🪵 OpenSearch Logging Stack

### Fluent Bit DaemonSet

```yaml
# k8s/logging/fluent-bit/daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
spec:
  selector:
    matchLabels:
      k8s-app: fluent-bit
  template:
    metadata:
      labels:
        k8s-app: fluent-bit
    spec:
      serviceAccountName: fluent-bit
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:2.2
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        - name: fluent-bit-config
          mountPath: /fluent-bit/etc/
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
      - name: fluent-bit-config
        configMap:
          name: fluent-bit-config
```

### OpenSearch Configuration

```yaml
# k8s/logging/opensearch/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: opensearch
  namespace: logging
spec:
  serviceName: opensearch
  replicas: 3
  selector:
    matchLabels:
      app: opensearch
  template:
    metadata:
      labels:
        app: opensearch
    spec:
      containers:
      - name: opensearch
        image: opensearchproject/opensearch:2.11.0
        env:
        - name: cluster.name
          value: "inventory-logs"
        - name: node.name
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: discovery.seed_hosts
          value: "opensearch-0.opensearch,opensearch-1.opensearch,opensearch-2.opensearch"
        - name: cluster.initial_master_nodes
          value: "opensearch-0,opensearch-1,opensearch-2"
        - name: OPENSEARCH_JAVA_OPTS
          value: "-Xms512m -Xmx512m"
        ports:
        - containerPort: 9200
          name: http
        - containerPort: 9300
          name: transport
        volumeMounts:
        - name: data
          mountPath: /usr/share/opensearch/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 50Gi
```

---

## 📚 Implementation Timeline

### Week 1-2: Infrastructure Setup
- [ ] Provision VMs with Terraform
- [ ] Install Kubernetes cluster (kubeadm/k3s) with Ansible
- [ ] Set up storage (NFS/Longhorn/Rook)
- [ ] Configure network policies

### Week 2-3: Zero Trust Security
- [ ] Install Service Mesh (Istio/Linkerd)
- [ ] Deploy Vault for secrets management
- [ ] Install Falco for runtime security
- [ ] Deploy OPA Gatekeeper with policies
- [ ] Configure mTLS

### Week 3-4: Core Services
- [ ] Deploy API Gateway (Kong)
- [ ] Deploy all 5 microservices
- [ ] Deploy PostgreSQL StatefulSet
- [ ] Deploy Redis for caching
- [ ] Configure Ingress

### Week 4-5: Observability
- [ ] Deploy Prometheus + Grafana
- [ ] Configure ServiceMonitors
- [ ] Create Grafana dashboards
- [ ] Deploy OpenSearch stack
- [ ] Configure Fluent Bit

### Week 5-6: CI/CD
- [ ] Create GitHub Actions workflows
- [ ] Set up ArgoCD
- [ ] Configure staging environment
- [ ] Configure production environment
- [ ] Create smoke test scripts

### Week 6-7: Testing & Optimization
- [ ] Load testing
- [ ] Security testing
- [ ] Performance optimization
- [ ] Documentation completion

### Week 7-8: Final Deliverables
- [ ] Complete deployment guide
- [ ] Architecture justification document
- [ ] Prepare presentation
- [ ] Demo preparation

---

## 📋 Next Steps

I'll now create:

1. **Complete Kubernetes manifests** for all services
2. **Terraform modules** for infrastructure
3. **Ansible playbooks** for cluster setup
4. **Complete CI/CD workflows**
5. **Monitoring configurations**
6. **Security policies**
7. **Documentation**

**Which component would you like me to create first?**

Options:
1. Kubernetes manifests (all services + monitoring + logging)
2. CI/CD pipeline files (6-stage workflow)
3. Terraform + Ansible for infrastructure
4. Zero Trust security configurations
5. Complete documentation (deployment guide)

Let me know and I'll start implementing!
