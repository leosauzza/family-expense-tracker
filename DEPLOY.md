# 🚀 Deployment Guide - Family Expense Tracker

This guide will help you set up automatic deployment to your home server using GitHub Actions.

## 📋 Prerequisites

- A GitHub repository with your code
- A home server with:
  - Ubuntu (or similar Linux distribution)
  - Docker and Docker Compose installed
  - SSH access enabled
  - Portainer (optional, but recommended)

## 🔧 Step 1: Server Setup

### 1.1 Install Docker (if not already installed)

```bash
# Update package index
sudo apt update

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to docker group (to run docker without sudo)
sudo usermod -aG docker $USER

# Apply group changes (logout and login again, or use):
newgrp docker
```

### 1.2 Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /opt/family-expense-tracker
sudo chown $USER:$USER /opt/family-expense-tracker

# Clone your repository
cd /opt/family-expense-tracker
git clone https://github.com/leosauzza/family-expense-tracker.git .
```

### 1.3 Create Environment File

```bash
cd /opt/family-expense-tracker

# Copy example environment file
cp .env.example .env

# Edit with your secure passwords
nano .env
```

**Important:** Change the default password to something secure!

```env
POSTGRES_DB=expensetracker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
ConnectionStrings__DefaultConnection=Host=db;Port=5432;Database=expensetracker;Username=postgres;Password=your_secure_password_here
```

### 1.4 Setup SSH Access for GitHub Actions

Generate an SSH key pair that GitHub Actions will use to access your server:

```bash
# On your local machine or server
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Copy public key to authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Display private key (you'll need to copy this to GitHub)
cat ~/.ssh/github_actions_deploy
```

**Important:** Keep the private key secure! Never commit it to the repository.

## 🔐 Step 2: GitHub Configuration

### 2.1 Add Repository Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `SERVER_IP` | `192.168.1.100` | Your server's IP address (local network) |
| `SERVER_USER` | `ubuntu` | Your server username |
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | The private key from Step 1.4 |

### 2.2 Push Code to GitHub

```bash
git add .
git commit -m "Add production deployment configuration"
git push origin main
```

## 🚀 Step 3: First Deploy

The deployment should trigger automatically when you push to the `main` branch. You can also trigger it manually:

### 3.1 Check GitHub Actions

Go to your GitHub repository → **Actions** tab

You should see the "Deploy to Home Server" workflow running.

### 3.2 Verify on Server

On your server, check if containers are running:

```bash
cd /opt/family-expense-tracker
docker compose -f docker-compose.prod.yml ps
```

You should see:
- `expense-tracker-db` (PostgreSQL)
- `expense-tracker-backend` (.NET API)
- `expense-tracker-pdf-parser` (Node.js - internal only)
- `expense-tracker-frontend` (Nginx)

### 3.3 Access Your Application

Open your browser and go to:
- **Frontend:** `http://YOUR_SERVER_IP:3500`
- **API:** `http://YOUR_SERVER_IP:3501`
- **Swagger:** `http://YOUR_SERVER_IP:3501/swagger`

## 🔒 Security Considerations

### PDF Parser is Internal Only

The PDF parser service is **not exposed** to the internet. It's only accessible within the Docker network by the backend service via `http://pdf-parser:3001`.

### Database is Internal Only

PostgreSQL is not exposed to the host. Only services within the Docker network can access it.

### Use Strong Passwords

Make sure to use strong passwords in your `.env` file, especially for PostgreSQL.

## 🔄 How It Works

1. **You push code** to the `main` branch
2. **GitHub Actions** triggers the workflow
3. **SSH into your server** using the stored private key
4. **Pull latest changes** from GitHub
5. **Build and deploy** using `docker-compose.prod.yml`
6. **Clean up** unused Docker images

## 🛠️ Troubleshooting

### Container not starting

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs [service-name]

# Example:
docker compose -f docker-compose.prod.yml logs backend
```

### Permission denied

Make sure your user is in the docker group:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Database connection errors

Verify `.env` file exists and has correct values:
```bash
cat /opt/family-expense-tracker/.env
```

### Port already in use

If ports 3500 or 3501 are already in use:
```bash
# Find what's using the port
sudo lsof -i :3500
sudo lsof -i :3501

# Stop the service or change ports in docker-compose.prod.yml
```

## 📱 Access from Other Devices

Since this is a local deployment, devices on your network can access it using the server's IP address:

```
http://192.168.1.100  (or your server's IP)
```

To find your server's IP:
```bash
hostname -I
```

## 🔄 Manual Deploy (if needed)

If you need to deploy manually without GitHub Actions:

```bash
cd /opt/family-expense-tracker
./deploy.sh
```

Or manually:
```bash
cd /opt/family-expense-tracker
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

## 📊 Portainer Integration (Optional)

If you're using Portainer:

1. Go to **Stacks** in Portainer
2. Click **Add Stack**
3. Name: `family-expense-tracker`
4. Build method: **Repository**
5. Repository URL: `https://github.com/leosauzza/family-expense-tracker`
6. Compose path: `docker-compose.prod.yml`
7. Add environment variables from your `.env` file
8. Click **Deploy the stack**

This gives you a nice GUI to manage your containers!

## 📝 Files Created

- `docker-compose.prod.yml` - Production Docker Compose configuration
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `.env.example` - Example environment variables
- `deploy.sh` - Manual deploy script
- `DEPLOY.md` - This guide

## 🎉 Done!

Your application should now be running on your home server with automatic deployments!

Every time you push to `main`, GitHub Actions will automatically deploy the changes to your server.
