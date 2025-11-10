# Kong API Gateway Configuration

## Overview

Kong Gateway serves as the **single entry point** for all client requests to the microservices. It provides essential production features including authentication, rate limiting, routing, and observability.

## Architecture Role

```
Client/Frontend → NGINX Ingress → Kong Gateway → Microservices
                                      ↓
                                  Prometheus (metrics)
```

## Features Implemented

### 1. **Security**
- ✅ **Rate Limiting**: 100-200 requests/minute per service
- ✅ **CORS**: Configured for frontend access
- ✅ **Request Size Limiting**: Max 5-10 MB payloads
- ✅ **Zero Trust**: Non-root user, capability dropping, readonly filesystem

### 2. **Routing**
- `/api/users/*` → user-service
- `/api/auth/*` → user-service
- `/api/products/*` → product-catalog-service
- `/api/categories/*` → product-catalog-service
- `/api/inventory/*` → inventory-service
- `/api/stock/*` → inventory-service
- `/api/orders/*` → order-service
- `/api/suppliers/*` → supplier-service
- `/api/purchase-orders/*` → supplier-service

### 3. **Observability**
- ✅ **Prometheus Metrics**: Exported on port 9542
- ✅ **Correlation IDs**: X-Correlation-ID header for request tracing
- ✅ **Access Logs**: JSON formatted to stdout
- ✅ **ServiceMonitor**: Auto-discovered by Prometheus

### 4. **High Availability**
- ✅ **Replicas**: 2 minimum, 10 maximum (HPA)
- ✅ **Auto-scaling**: CPU, Memory, and Request-based
- ✅ **Pod Anti-Affinity**: Spread across nodes
- ✅ **Health Checks**: Liveness and readiness probes

### 5. **Zero Trust Network**
- ✅ **NetworkPolicy**: Explicit ingress/egress rules
- ✅ **Service Mesh Ready**: Works with Istio/Linkerd
- ✅ **Pod Security Standards**: Restricted mode

## Deployment

### Prerequisites
```bash
# Ensure monitoring namespace exists (for ServiceMonitor)
kubectl create namespace monitoring

# Ensure inventory-system namespace exists
kubectl apply -f ../namespaces/inventory-system.yaml
```

### Deploy Kong Gateway
```bash
# Create Kong namespace
kubectl apply -f namespace.yaml

# Deploy Kong components
kubectl apply -f kong-config.yaml
kubectl apply -f kong-deployment.yaml
kubectl apply -f kong-service.yaml
kubectl apply -f kong-hpa.yaml
kubectl apply -f kong-servicemonitor.yaml
kubectl apply -f kong-networkpolicy.yaml

# Wait for deployment
kubectl wait --for=condition=available --timeout=300s \
  deployment/kong-gateway -n kong

# Check status
kubectl get pods -n kong
kubectl get svc -n kong
```

## Configuration

### DB-less Mode
Kong runs in **declarative/DB-less mode** for simplicity:
- ✅ No database required (PostgreSQL not needed)
- ✅ Configuration via ConfigMap
- ✅ GitOps friendly (version controlled)
- ✅ Fast startup and deployment

### Route Configuration
All routes are defined in `kong-config.yaml`:
```yaml
services:
- name: user-service
  url: http://user-service.inventory-system.svc.cluster.local:80
  routes:
  - paths:
    - /api/users
    - /api/auth
```

### Plugins Enabled
1. **rate-limiting**: Prevent abuse
2. **cors**: Cross-origin requests
3. **request-size-limiting**: Prevent large payloads
4. **prometheus**: Metrics export
5. **correlation-id**: Request tracing

## Testing

### Test Kong Gateway
```bash
# Get Kong proxy service
KONG_PROXY=$(kubectl get svc kong-proxy -n kong -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# For NodePort (self-managed K8s):
KONG_PROXY=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[0].address}')
KONG_PORT=$(kubectl get svc kong-proxy -n kong -o jsonpath='{.spec.ports[0].nodePort}')

# Test user service through gateway
curl http://$KONG_PROXY:$KONG_PORT/api/users

# Test with correlation ID
curl -i http://$KONG_PROXY:$KONG_PORT/api/products \
  -H "X-Correlation-ID: test-123"

# Test rate limiting (send 101 requests)
for i in {1..101}; do
  curl -s http://$KONG_PROXY:$KONG_PORT/api/users
done
# Should receive 429 Too Many Requests after 100
```

### Test Admin API (Internal)
```bash
# Port forward to admin API
kubectl port-forward -n kong svc/kong-admin 8001:8001

# Check Kong status
curl http://localhost:8001/status

# List services
curl http://localhost:8001/services

# List routes
curl http://localhost:8001/routes

# Check plugins
curl http://localhost:8001/plugins
```

### Test Metrics
```bash
# Port forward to metrics endpoint
kubectl port-forward -n kong svc/kong-metrics 9542:9542

# Get Prometheus metrics
curl http://localhost:9542/metrics

# Check key metrics:
# - kong_http_requests_total
# - kong_latency_bucket
# - kong_bandwidth_bytes
```

## Monitoring

### Prometheus Metrics
Kong exports comprehensive metrics:
- **Request metrics**: Total requests, status codes, latency
- **Bandwidth metrics**: Ingress/egress bytes
- **Connection metrics**: Active connections
- **Plugin metrics**: Rate limiting, auth failures

### Grafana Dashboard
Import Kong dashboard (ID: 7424) in Grafana for visualization.

### Alerts
Common alerts to configure:
- High error rate (5xx responses)
- High latency (p99 > 1s)
- Rate limit hits (excessive 429s)
- Gateway unavailable

## Troubleshooting

### Kong pods not starting
```bash
# Check logs
kubectl logs -n kong deployment/kong-gateway

# Common issues:
# - Invalid declarative config syntax
# - ConfigMap not mounted
# - Port conflicts
```

### Routes not working
```bash
# Verify declarative config
kubectl get cm kong-declarative-config -n kong -o yaml

# Check if services are reachable from Kong
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n kong \
  -- curl http://user-service.inventory-system.svc.cluster.local:80/health

# Check Kong routes
kubectl port-forward -n kong svc/kong-admin 8001:8001
curl http://localhost:8001/routes
```

### Rate limiting not working
```bash
# Check plugin configuration
curl http://localhost:8001/plugins

# Verify rate-limiting plugin is enabled
curl http://localhost:8001/services/user-service/plugins
```

### High latency
```bash
# Check Kong metrics
curl http://localhost:9542/metrics | grep kong_latency

# Check upstream service latency
kubectl logs -n inventory-system deployment/user-service --tail=100
```

## Scaling

### Manual Scaling
```bash
# Scale Kong replicas
kubectl scale deployment/kong-gateway -n kong --replicas=5
```

### HPA Scaling
HPA automatically scales based on:
- CPU > 70%
- Memory > 80%
- HTTP requests/sec > 2000

```bash
# Check HPA status
kubectl get hpa -n kong
kubectl describe hpa kong-gateway-hpa -n kong
```

## Security

### NetworkPolicy
Kong can only:
- **Receive from**: NGINX Ingress, Prometheus
- **Send to**: Backend services, DNS, external HTTPS

### Zero Trust Features
- ✅ Non-root user (UID 1000)
- ✅ Drop all capabilities
- ✅ Readonly root filesystem
- ✅ Seccomp profile (RuntimeDefault)

### Adding JWT Authentication (Optional)
To add JWT validation:
```yaml
plugins:
- name: jwt
  config:
    key_claim_name: kid
    secret_is_base64: false
```

## Upgrading Kong

```bash
# Update image version in kong-deployment.yaml
# Then apply:
kubectl apply -f kong-deployment.yaml

# Monitor rollout
kubectl rollout status deployment/kong-gateway -n kong
```

## Integration with Frontend

Update frontend environment variable:
```bash
# .env.production
VITE_API_BASE_URL=http://<KONG_PROXY_IP>/api
```

All frontend requests now go through Kong Gateway.

## Next Steps

1. ✅ Deploy Kong Gateway
2. ✅ Test routes and plugins
3. ✅ Configure NGINX Ingress to point to Kong
4. ✅ Update frontend to use Kong endpoint
5. ✅ Add JWT authentication plugin (optional)
6. ✅ Import Kong Grafana dashboard
7. ✅ Configure AlertManager rules
8. ✅ Load test Kong gateway

## Resources

- **Kong Documentation**: https://docs.konghq.com/
- **Kong Ingress Controller**: https://github.com/Kong/kubernetes-ingress-controller
- **Kong Grafana Dashboard**: https://grafana.com/grafana/dashboards/7424
- **Rate Limiting Plugin**: https://docs.konghq.com/hub/kong-inc/rate-limiting/
