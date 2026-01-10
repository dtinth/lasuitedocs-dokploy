# LaSuite Docs on Dokploy

This repository contains the [LaSuite Docs](https://github.com/suitenumerique/docs) Docker Compose project optimized for deployment on [Dokploy](https://dokploy.com/), programmatically modified from the official [Docker Compose setup](https://github.com/suitenumerique/docs/blob/main/docs/installation/compose.md).

It assumes you have:

- A Dokploy instance
- A subdomain ready for use
- AWS S3-compatible storage for media files
- An OIDC provider (e.g., authentik) for authentication

## Deployment on Dokploy

1. In Dokploy, create a new "Compose" service with the contents of `docker-compose.yml` from this repository
2. Go to the service "Environment" tab and use `.env.example` as a template. Fill in the required variables
3. Go to the service "Domains" tab and add a domain binding:
   - **Service**: `caddy`
   - **Port**: `8083`
   - **Domain**: Your chosen domain (e.g., `docs.example.com`)
4. Click the "Deploy" button and wait for all services to start.
5. Initialize the database by clicking "Open Terminal" and choose the `backend` container and `/bin/sh` as the shell, then run the following commands:
   ```bash
   cd /app
   python manage.py migrate
   python manage.py createsuperuser --email <admin@example.com> --password <secure_password>
   ```

## Regenerate Docker Compose

To regenerate the `docker-compose.yml` and `.env.example` files from the official repository, run:

```bash
bun generate.ts
```
