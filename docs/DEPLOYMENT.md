# FedEx DCA Control Tower - Deployment Guide

## 🐳 What is Docker?

**Docker** is a platform that packages your application and all its dependencies into a **container** - a lightweight, portable unit that runs consistently on any machine.

### Why Docker?

| Problem Without Docker | Solution With Docker |
|------------------------|---------------------|
| "It works on my machine" but fails elsewhere | Same container runs everywhere |
| Complex dependency installation | Dependencies bundled inside |
| Different OS/environments | Containers are OS-agnostic |
| Hard to scale | Easy to replicate containers |
| Manual server setup | Automated deployment |

### Docker Concepts

```
┌─────────────────────────────────────────┐
│  Your Machine / Cloud Server            │
│  ┌───────────┐  ┌───────────┐           │
│  │ Container │  │ Container │           │
│  │ (Web App) │  │ (ML Svc)  │           │
│  │ Port 3000 │  │ Port 8000 │           │
│  └───────────┘  └───────────┘           │
│         ↑              ↑                │
│         └──── Network ─┘                │
│              (fedex-network)            │
└─────────────────────────────────────────┘
```

- **Image**: Blueprint of your app (like a recipe)
- **Container**: Running instance of an image (like a dish)
- **Dockerfile**: Instructions to build an image
- **docker-compose.yml**: Defines multiple containers that work together

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Web App)

**Pros:** 
- Free tier available
- Automatic deployments from GitHub
- Edge network (fast globally)
- Built-in SSL

**Steps:**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_key (optional)
   ```
5. Deploy!

**Note:** For the ML service, use Railway or Render (see below)

---

### Option 2: Railway (Full Stack)

**Pros:**
- Supports Docker
- Easy database hosting
- $5/month free credits

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Connect GitHub repository
3. Add two services:
   - **Web App** (Next.js)
   - **ML Service** (Python)
4. Configure environment variables
5. Deploy

---

### Option 3: Docker on VPS (AWS/DigitalOcean)

**Pros:**
- Full control
- Cost-effective for high traffic

**Steps:**

1. **Get a VPS** (DigitalOcean Droplet, AWS EC2, etc.)
   - Recommended: 2GB RAM, 1 vCPU minimum

2. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

3. **Clone your repo:**
   ```bash
   git clone https://github.com/your-username/fedex-dca-control-tower.git
   cd fedex-dca-control-tower
   ```

4. **Create .env file:**
   ```bash
   cat > .env << EOF
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
   SUPABASE_SERVICE_ROLE_KEY=xxx
   RESEND_API_KEY=xxx
   SMTP_USER=your-email
   SMTP_PASS=your-app-password
   EOF
   ```

5. **Deploy with Docker Compose:**
   ```bash
   docker compose up -d
   ```

6. **Set up Nginx (reverse proxy):**
   ```bash
   apt install nginx
   ```

   Create `/etc/nginx/sites-available/fedex`:
   ```nginx
   server {
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }
   }
   ```

7. **Enable HTTPS with Certbot:**
   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

---

## 🔧 Docker Commands Reference

```bash
# Build images
docker compose build

# Start containers
docker compose up -d

# Stop containers
docker compose down

# View logs
docker compose logs -f

# View running containers
docker ps

# Rebuild and restart
docker compose up -d --build

# Remove all containers and images
docker compose down --rmi all
```

---

## 🌐 Production Checklist

### Environment Variables
- [ ] All Supabase credentials configured
- [ ] Email service (Resend/SMTP) configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured

### Security
- [ ] HTTPS enabled
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] Database credentials secured
- [ ] API keys rotated regularly

### Monitoring
- [ ] Container health checks working
- [ ] Log aggregation set up
- [ ] Uptime monitoring configured

---

## 📱 Quick Start (Local Docker)

```bash
# 1. Clone and enter directory
cd FEDEX_PROJECT

# 2. Build images
docker compose build

# 3. Start services
docker compose up -d

# 4. Check status
docker ps

# 5. Access app
open http://localhost:3001   # Web App
open http://localhost:8000   # ML Service
```

---

*Last updated: January 2, 2026*
