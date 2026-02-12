# 🚀 Deployment Guide - Family Expense Tracker

Guía para configurar deploy automático a tu servidor Ubuntu con Portainer.

## 📋 Prerequisites

- Servidor Ubuntu con Docker y Docker Compose instalados
- Portainer instalado y corriendo
- Acceso SSH al servidor
- Cuenta de GitHub con este repositorio

---

## 🎯 Opciones de Deploy

Tienes **dos opciones** para el deploy automático:

| Opción | Descripción | Ideal para |
|--------|-------------|------------|
| **A. Portainer GitOps** ⭐ | Portainer monitorea el repo Git y actualiza automáticamente | **Recomendado** - Menos configuración, todo en Portainer |
| **B. GitHub Actions + SSH** | GitHub Actions se conecta vía SSH y ejecuta docker compose | Si prefieres control desde GitHub |
| **C. GitHub Actions + Portainer Webhook** | Build en GH Actions + trigger webhook a Portainer | Si quieres builds en cloud y deploy en Portainer |

---

# Opción A: Portainer GitOps (Recomendado) ⭐

Portainer se encarga de todo automáticamente. Cuando haces push a `main`, Portainer detecta el cambio y redeploya.

## Paso 1: Configurar el Stack en Portainer

1. Accede a tu Portainer (http://TU_SERVIDOR:9000)
2. Ve a **Stacks** → **Add Stack**
3. Configura:

| Campo | Valor |
|-------|-------|
| Name | `family-expense-tracker` |
| Build method | **Repository** |
| Repository URL | `https://github.com/leosauzza/family-expense-tracker` |
| Repository reference | `refs/heads/main` |
| Compose path | `docker-compose.prod.yml` |
| Automatic updates | ✅ **Enabled** |
| Fetch interval | `5m` (o el que prefieras) |

4. En **Environment variables**, agrega todas las variables de tu archivo `.env`:

```
POSTGRES_DB=expensetracker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_segura
ConnectionStrings__DefaultConnection=Host=db;Port=5432;Database=expensetracker;Username=postgres;Password=tu_password_segura
```

5. Click **Deploy the stack**

## Paso 2: Configurar Acceso al Repo (si es privado)

Si tu repo es privado, necesitas configurar autenticación:

1. Ve a **Settings** → **Authentication** en Portainer
2. O al crear el stack, expande **Authentication** y agrega:
   - Username: tu usuario de GitHub
   - Personal Access Token: [crear uno aquí](https://github.com/settings/tokens) con permiso `repo`

## Paso 3: Verificar Deploy Automático

Haz un cambio en el código y push a `main`:

```bash
git add .
git commit -m "Test deploy automático"
git push origin main
```

En ~5 minutos, Portainer debería detectar el cambio y redeployar automáticamente.

---

# Opción B: GitHub Actions + SSH

GitHub Actions se conecta a tu servidor vía SSH y ejecuta los comandos de deploy.

## Paso 1: Generar SSH Key

En tu servidor Ubuntu:

```bash
# Generar key pair
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# Agregar a authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Ver la private key (la necesitarás en GitHub)
cat ~/.ssh/github_actions
```

## Paso 2: Configurar Secrets en GitHub

Ve a tu repo en GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Valor |
|-------------|-------|
| `SERVER_IP` | IP de tu servidor (ej: `192.168.1.100`) |
| `SERVER_USER` | Usuario SSH (ej: `ubuntu`) |
| `SSH_PRIVATE_KEY` | El contenido completo de `~/.ssh/github_actions` |

## Paso 3: Preparar Directorio en el Servidor

```bash
# Crear directorio para la app
sudo mkdir -p /opt/family-expense-tracker
sudo chown $USER:$USER /opt/family-expense-tracker

# Crear archivo .env
cd /opt/family-expense-tracker
cp .env.example .env
nano .env  # Editar con tus valores
```

## Paso 4: Probar Deploy

Haz push a `main` o ejecuta manualmente el workflow en GitHub → Actions → "Deploy to Home Server (SSH)"

---

# Opción C: GitHub Actions + Portainer Webhook

Build de imágenes en GitHub Actions + trigger webhook a Portainer para redeploy.

## Paso 1: Configurar GitHub Container Registry (GHCR)

Las imágenes se publicarán automáticamente en GHCR. No necesitas configurar nada extra, usa el `GITHUB_TOKEN` automático.

## Paso 2: Crear Stack en Portainer con Webhook

1. En Portainer: **Stacks** → **Add Stack**
2. Build method: **Web editor**
3. Pega el contenido de `docker-compose.portainer.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - expense-tracker-network
    restart: unless-stopped

  backend:
    image: ghcr.io/leosauzza/expense-tracker-backend:latest
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ConnectionStrings__DefaultConnection: ${ConnectionStrings__DefaultConnection}
    ports:
      - "3501:8080"
    networks:
      - expense-tracker-network
    restart: unless-stopped

  pdf-parser:
    image: ghcr.io/leosauzza/expense-tracker-pdf-parser:latest
    environment:
      PORT: 3001
      NODE_ENV: production
    networks:
      - expense-tracker-network
    restart: unless-stopped

  frontend:
    image: ghcr.io/leosauzza/expense-tracker-frontend:latest
    ports:
      - "3500:80"
    networks:
      - expense-tracker-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  expense-tracker-network:
```

4. Agrega las environment variables
5. **Importante**: Habilita **Webhook** en el stack (aparece después de crearlo)
6. Copia la URL del webhook (ej: `http://portainer:9000/api/stacks/webhook/abc-123`)

## Paso 3: Configurar Secret del Webhook

En GitHub → Settings → Secrets:

| Secret Name | Valor |
|-------------|-------|
| `PORTAINER_WEBHOOK_URL` | URL completa del webhook que copiaste |

## Paso 4: Configurar GHCR en Portainer

Para que Portainer pueda pull imágenes de GitHub Container Registry:

1. En Portainer: **Registries** → **Add registry**
2. Type: **Custom**
3. Name: `ghcr.io`
4. Registry URL: `ghcr.io`
5. Authentication: ON
6. Username: tu usuario de GitHub
7. Password: Personal Access Token con permisos `read:packages`

## Paso 5: Probar

Haz push a `main`. El workflow:
1. Hará build de las imágenes
2. Las subirá a GHCR
3. Llamará al webhook de Portainer
4. Portainer hará redeploy con las nuevas imágenes

---

## 🔧 Preparación Inicial del Servidor

Independientemente de la opción que elijas, necesitas:

### 1. Instalar Docker y Docker Compose

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Agregar repo de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Instalar Portainer

```bash
# Crear volumen para Portainer
docker volume create portainer_data

# Ejecutar Portainer
docker run -d \
  -p 8000:8000 \
  -p 9443:9443 \
  -p 9000:9000 \
  --name portainer \
  --restart=unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Accede a Portainer en: `https://TU_SERVIDOR:9443` (o `http://TU_SERVIDOR:9000`)

---

## 📁 Archivos del Proyecto

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.yml` | Configuración de desarrollo local |
| `docker-compose.prod.yml` | Configuración producción (build local) |
| `docker-compose.portainer.yml` | Configuración usando imágenes GHCR |
| `.github/workflows/deploy.yml` | Deploy vía SSH (Opción B) |
| `.github/workflows/build-and-push.yml` | Build + push a GHCR (Opción C) |

---

## 🛠️ Troubleshooting

### "Permission denied" en GitHub Actions

```bash
# En el servidor, verificar que la key está en authorized_keys
cat ~/.ssh/authorized_keys

# Verificar permisos
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Portainer no puede pull imágenes de GHCR

1. Verifica que creaste el Personal Access Token con permiso `read:packages`
2. En Portainer: **Registries** → Verifica que la registry `ghcr.io` está configurada
3. Prueba hacer login manual: `docker login ghcr.io -u TU_USUARIO`

### Variables de entorno no aplican

En Portainer, después de cambiar variables:
1. Ve al stack
2. Click **Editor** tab
3. Click **Update the stack**
4. Selecciona **Re-pull image and redeploy**

### Puertos ocupados

```bash
# Ver qué usa el puerto
sudo lsof -i :3500
sudo lsof -i :3501

# Cambiar puertos en las environment variables del stack:
FRONTEND_PORT=3600
BACKEND_PORT=3601
```

---

## 🎉 ¡Listo!

Elige la opción que prefieras:

- **Opción A (GitOps)**: Más simple, todo en Portainer
- **Opción B (SSH)**: Control total desde GitHub
- **Opción C (Webhook)**: Build rápido en cloud, deploy en Portainer
