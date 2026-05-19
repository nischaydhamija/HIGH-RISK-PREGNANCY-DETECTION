# VPS Deployment Guide

This guide prepares the existing MatriCare application for an Ubuntu VPS without changing the current Render + Vercel deployment setup.

The repository already supports:

- Backend startup with `uvicorn main:app --host 0.0.0.0 --port 8000`
- Frontend production output in `frontend/dist`
- React Router refresh support through the Vercel rewrite already present in `frontend/vercel.json`
- Existing Render deployment through `render.yaml`

## 1. Server prerequisites

Update the server and install required packages.

```bash
sudo apt update
sudo apt install -y git nginx python3 python3-venv python3-pip
```

Install Node.js 20 or newer using your preferred method. On Ubuntu, an LTS Node.js install from NodeSource or nvm works well.

## 2. Clone the repository

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone <your-repo-url> high-risk-pregnancy-detection
cd high-risk-pregnancy-detection
```

## 3. Backend environment

Create and activate a virtual environment for the backend.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

Create the backend environment file from [backend/.env.example](backend/.env.example).

```bash
cp backend/.env.example backend/.env
```

Set these values in `backend/.env`:

- `MONGODB_URI` for MongoDB Atlas
- `SECRET_KEY` for future security-related use
- `FRONTEND_URL` for your public frontend origin
- `CORS_ORIGINS` as a comma-separated list when you need more than one allowed origin
- `MONGO_DB_NAME` if you want to override the default database name

If you are migrating from the older environment name, `MONGO_URI` is still accepted as a fallback.

## 4. Verify backend startup

From the backend directory, the production command is:

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

For a server-managed process, the same command is used by the systemd example service in [matricare-backend.service.example](matricare-backend.service.example).

## 5. Run the backend as a service

Copy the systemd example and adjust paths to match your server layout.

```bash
sudo cp matricare-backend.service.example /etc/systemd/system/matricare-backend.service
sudo systemctl daemon-reload
sudo systemctl enable matricare-backend
sudo systemctl start matricare-backend
sudo systemctl status matricare-backend
```

## 6. Frontend environment

Create the frontend build-time environment file from [frontend/.env.production.example](frontend/.env.production.example).

```bash
cp frontend/.env.production.example frontend/.env.production
```

Set `VITE_API_URL` to the public backend origin that the browser can reach.

Examples:

- `https://api.example.com`
- `https://your-backend-domain.com`
- `http://your-server-ip:8000` for temporary testing only

## 7. Verify frontend build path

The frontend production build output is `frontend/dist`. That is the directory Nginx should serve.

Build the frontend:

```bash
cd frontend
npm install
npm run build
```

If the build succeeds, the static output will be available in `frontend/dist`.

## 8. Configure Nginx

Copy [nginx.conf.example](nginx.conf.example) into your Nginx configuration and update the domain names and local paths.

The example shows two server blocks:

- one for serving the frontend SPA from `frontend/dist`
- one for proxying the backend API on `127.0.0.1:8000`

If you prefer a single public domain, you can still use the same frontend build output and point `VITE_API_URL` at the backend hostname you expose.

Reload Nginx after validation:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Firewall and Atlas access

- Open ports `80` and `443` on the VPS if you are serving Nginx publicly.
- Allow the VPS public IP in MongoDB Atlas network access.
- Keep `8000` private if you only want Nginx to reach Uvicorn locally.

## 10. Keep existing hosting compatibility

Do not change `render.yaml` or the existing Vercel rewrite if you are still using those platforms.

The current repository already keeps:

- Render backend deployment stable
- Vercel frontend deployment stable
- React Router refresh support on Vercel through `frontend/vercel.json`

This VPS guide is an additional deployment path, not a replacement for the current one.