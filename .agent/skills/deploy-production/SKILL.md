---
name: deploy-production
description: >
  Use this skill when changing or debugging production deployment, Docker Compose,
  GitHub Actions deploy workflow, Nginx reverse proxy, Let's Encrypt/Certbot,
  AWS EC2 runtime, environment variables, production ports, or health checks for
  AI-Hires/Intervio.
---

# Skill: Production Deployment and Operations

Use this for production-oriented changes and incident debugging.

## Key Files

- `.github/workflows/deploy.yml`
- `backend/docker-compose.prod.yml`
- `backend/docker-compose.yml`
- `backend/Dockerfile`
- Nginx config files under `backend/` if present
- Backend environment files on the server, not committed to git

## Production Shape

- Frontend is hosted separately and calls the API domain.
- Backend services run on AWS EC2 with Docker Compose.
- Nginx terminates HTTPS and reverse-proxies to Spring Boot and MinIO routes.
- MySQL, Redis, RabbitMQ, and MinIO should not be public internet services.
- GitHub Actions deploys by SSH into the EC2 host.

## Change Rules

1. Never commit real `.env` files, private keys, certificates, or API secrets.
2. Keep production ports private unless the service must be public.
3. Treat `docker-compose.prod.yml` and deploy workflow changes as high-risk.
4. Check rollback path before changing Nginx, TLS, DB volumes, or container names.
5. Do not run destructive Docker cleanup commands unless the user explicitly approves.

## Debug Flow

1. Identify the failing layer:
   - GitHub Actions SSH/deploy
   - Docker image build
   - Docker Compose startup
   - Spring Boot boot failure
   - Database/Redis/RabbitMQ/MinIO connection
   - Nginx routing or TLS
2. Inspect logs for that layer before editing config.
3. Verify environment variables are present on the server.
4. Verify container health and port bindings.
5. For API failures, check Spring Boot logs before assuming Nginx is wrong.
6. For browser CORS/cookie failures, check backend CORS config and frontend API domain.

## Common Commands

Run from the server/project directory as appropriate:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=200 backend
docker compose -f docker-compose.prod.yml logs --tail=200 nginx
docker compose -f docker-compose.prod.yml up -d --build
```

Use production commands only when the user has asked for production work and the target
environment is clear.

## Verification

- [ ] GitHub Actions workflow completes successfully.
- [ ] Containers are up and healthy.
- [ ] API health or Swagger endpoint responds through HTTPS.
- [ ] Frontend can call the production API without CORS or cookie failures.
- [ ] RabbitMQ, MySQL, Redis, and MinIO are not exposed publicly.
- [ ] No secrets were added to git-tracked files.
