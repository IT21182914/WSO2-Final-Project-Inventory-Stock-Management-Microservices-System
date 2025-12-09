# Developer Guide (DEV_GUIDE)

This document captures the adaptations made while moving from the previous per-microservice repositories (https://github.com/IT21182914/WSO2-Final-Project-Inventory-Stock-Management-Microservices-System.git) to the monorepo at https://github.com/KubeStock-DevOps-project/kubestock-core.git. It explains CI/CD changes, authentication and identity changes, routing, and the recommended local development workflow.

Note: This guide intentionally does not include screenshots.

---

## High-level changes / context

- The project returned to a monorepo structure. Per-microservice repositories are now deprecated. All developer-facing code and documentation live in the kubestock-core repository.
- Many runtime responsibilities were moved off microservices (for example: authentication and RBAC), and the platform (Istio, Argo CD, ECR) now handles them.

---

## CI/CD flow changes

Previous model:
- Branch-based deployments (staging, production branches, etc.)

Current model:
- Trunk-based / automated approach.
- Validations (tests, linters, static checks) run on Pull Requests.
- On merge to main:
  - The merged commit is automatically deployed to staging via Argo CD and pushed to ECR.
  - A manual approval step triggers deployment to production via Argo CD.
- Summary:
  - PR -> validation
  - Merge -> automatic staging deployment
  - Approval -> production deployment

---

## Authentication, Identity, and RBAC

High-level:
- The old internal user service (storing user_id, password hashes, email, etc.) has been replaced by Asgardio Identity Service.
- We no longer maintain user credentials or profile data. Asgardio performs authentication and user management.
- Supplier domain data in the supplier database may include references to the Asgardio user id for domain-specific linking, but we do not store passwords or profile credentials.

identity-service microservice:
- The former user-service has been replaced by a dedicated microservice called identity-service.
- identity-service acts as a proxy/gateway for Asgardio-related API calls and domain lookups.
- Its responsibilities:
  - Proxy certain calls to Asgardio on behalf of application components when domain-level user info is required.
  - Serve as a light validation guardrail by validating incoming JWT tokens when configured to do so.
    - This validation is intentionally minimal and used only as a second-line check.
    - The primary token validation and authentication enforcement remain the responsibility of the service mesh (Istio).
  - Expose limited identity-related endpoints for other services to consult (e.g., resolving Asgardio user id to supplier domain data).
- Important: Other microservices should not implement full token validation on their own — Istio enforces authentication and mTLS. Services may rely on the identity-service for optional validation or lookups but should primarily trust Istio for auth enforcement.

How it works now:
- Asgardio acts as the identity provider. Applications call Asgardio APIs on behalf of the user (through a proxy identity flow) as needed.
- Authentication enforcement moved out of microservices and into the service mesh (Istio). Microservices no longer perform token validation by default.
- The previous auth middleware in each service was replaced by a lightweight JWT token converter:
  - It extracts information such as user id and groups/roles from the incoming JWT and populates request context for application code.
  - It does not validate tokens; Istio enforces token validation and mTLS at the mesh edge.
- RBAC:
  - RBAC is primarily implemented using Asgardio groups.
  - There is no fine-grained role enforcement per microservice beyond group membership and the decoded token data.
  - Group names used by the system are:
    - admin
    - supplier
    - warehouse_staff

JWT shape and sample:
- The incoming JWT will contain group membership info and other claims required by services.
- For debugging, a sample JWT is available: samples/jwt.json
  - https://github.com/KubeStock-DevOps-project/kubestock-core/blob/main/samples/jwt.json
- If you work on the token converter, identity-service, or RBAC logic, ensure the shape in jwt.json matches expected claims and update tests if you change claim names.

Front-end authentication:
- Front-end previously performed manual token storage, profile management, and password workflows.
- The frontend now relies on Asgardio for everything related to authentication and profile management. No in-app password/profile pages are maintained in this repo.

---

## CORS and Origins

- CORS configurations were removed from services because the entire application runs under a single origin in production.
- During local development you may enable local gateway routing (see below). If that is done incorrectly, CORS issues may appear — follow the local dev notes to avoid them.

---

## Routing and Gateway rules

- All application API calls are routed through the gateway using the "/api" prefix.
  - Any request with the `/api` prefix is treated as backend traffic.
  - Traffic without `/api` is served by the frontend (static assets / SPA routes).
- Service mapping:
  - Requests use the prefix `/api/<service_name>` to identify which backend service should handle the request.
  - The gateway strips the `/api/<service_name>` prefix before forwarding to the microservice.
  - Example:
    - Incoming: https://gateway/api/product/all
    - Gateway -> forwards to product-service as: https://product-service/all
- Local gateway configuration is in:
  - gateway/nginx.conf
  - https://github.com/KubeStock-DevOps-project/kubestock-core/blob/main/gateway/nginx.conf

---

## Local development guide

Important: The system uses single-origin policy in production. For local development, follow these steps to avoid CORS and to run a single microservice locally while keeping the gateway and other services in Docker Compose.

1. Environment variable for local dev
   - Keep `VITE_API_GATEWAY_URL` empty for normal local development. If you set it to a custom gateway URL you may encounter CORS unless the gateway mirrors production behavior.

2. Start required Docker services
   - Start only Postgres first (to initialize DBs). Example:
     - docker compose up -d postgres
   - Run the SQL script that creates sub-databases (one-time operation). This script initializes the per-service schemas/databases used by the microservices.

3. Bring up the rest of the stack
   - docker compose up -d
   - This starts the gateway (nginx), supporting services, and other infrastructure containers needed for local testing.

4. Run a single service locally for iterative debugging
   - Stop the service in Docker Compose that you want to run locally:
     - docker compose down <service_name> (or `docker compose stop <service_name>`)
   - Start the service locally from your development environment:
     - cd services/<service_name>
     - npm install (if needed)
     - npm run dev
   - The gateway (running in Docker Compose) forwards traffic to your host machine using host.docker.internal. Because of this, the gateway will reach your locally-running dev server on the host (so long as the service listens on the correct port and host).

5. Iterate and test
   - Make code changes locally, verify via the gateway or direct calls as appropriate.
   - When ready, push your branch and open a PR:
     - PR validations will run (tests, linters).
     - Once tests pass, proceed with merge to main and the deployment flow described above.

Notes:
- The gateway configuration intentionally routes outward to host.docker.internal to enable local host development. Ensure your local dev server binds to 0.0.0.0 or host.docker.internal-accessible interface and the expected port.
- If you see CORS errors while doing local debugging, double-check `VITE_API_GATEWAY_URL` and the gateway bindings.

---

## Troubleshooting and debugging tips

- Token and RBAC issues:
  - Check samples/jwt.json for expected claim names.
  - If a service isn't receiving expected claims, inspect the token converter middleware or identity-service logs.
  - Remember: Istio does token validation. identity-service may perform optional token validation as a guardrail, but primary enforcement is done by Istio.

- Routing issues:
  - Inspect gateway/nginx.conf to confirm path prefix stripping behavior.
  - Validate the forwarded upstream URL and ensure the target service is reachable.

- Local dev connectivity:
  - If Dockerized gateway cannot reach your host dev server, confirm host.docker.internal resolution and that your dev server allows external connections.

---

## What we don't do anymore

- No in-repo user credential storage (no password hashes or profile management).
- No per-microservice authentication or token validation (this is handled by Istio).
- No CORS configuration for production (single origin app).
- No screenshots or UI profile documentation in this repo.

---

If you need this file committed to the repository, tell me and I will push it into `docs/DEV_GUIDE.md` on the desired branch.