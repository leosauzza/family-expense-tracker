# 🚀 Deployment Guide - Family Expense Tracker

Guía para configurar deploy automático a tu servidor Ubuntu con Portainer.

## 📋 Prerequisites

- Servidor Ubuntu con Docker y Docker Compose instalados
- Portainer instalado y corriendo
- Acceso SSH al servidor
- Cuenta de GitHub con este repositorio

---

## 🎯 Opciones de Deploy

Tienes **tres opciones** para el deploy automático:

| Opción | Descripción | Ideal para |
|--------|-------------|------------|
| **A. Portainer GitOps** ⭐ | Portainer monitorea el repo Git y actualiza automáticamente | **Recomendado** - Menos configuración, todo en Portainer |
| **B. GitHub Actions + SSH** | GitHub Actions se conecta vía SSH y ejecuta docker compose | Si prefieres control desde GitHub |
| **C. GitHub Actions + Portainer Webhook** | Build en GH Actions + trigger webhook a Portainer | Si quieres builds en cloud y deploy en Portainer |

---

# Opción A: Portainer GitOps (Recomendado) ⭐

Portainer se encarga de todo automáticamente. Cuando haces push a `main`, Portainer detecta el cambio y redeploya.

## Paso 1: Preparar el Servidor (Ubuntu)

Conectate por SSH a tu servidor:

```bash
ssh tu-usuario@IP_DE_TU_SERVIDOR
```

### 1.1 Instalar Docker

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
sudo apt install -y docker.io docker-compose-plugin

# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalación
docker --version
docker compose version
```

### 1.2 Instalar Portainer

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

Accedé a Portainer en: `https://IP_DE_TU_SERVIDOR:9443`

Configurá el usuario admin inicial.

---

## Paso 2: Crear el Stack en Portainer

### 2.1 Ir a Stacks

1. En el menú lateral, click en **Stacks**
2. Click en **+ Add stack**

### 2.2 Configurar el Stack

| Campo | Valor |
|-------|-------|
| **Name** | `family-expense-tracker` |
| **Build method** | **Repository** |
| **Repository URL** | `https://github.com/leosauzza/family-expense-tracker` |
| **Repository reference** | `refs/heads/main` |
| **Compose path** | `docker-compose.prod.yml` |

### 2.3 Habilitar Actualización Automática

En **Automatic updates**:
- ✅ **Enable automatic updates**
- **Fetch interval**: `5m`

### 2.4 Configurar Variables de Entorno

En la sección **Environment variables**, agregá:

```bash
POSTGRES_DB=expensetracker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_muy_segura_aqui
ConnectionStrings__DefaultConnection=Host=db;Port=5432;Database=expensetracker;Username=postgres;Password=tu_password_muy_segura_aqui
FRONTEND_PORT=3500
BACKEND_PORT=3501
```

> ⚠️ **IMPORTANTE**: Usá la misma contraseña en `POSTGRES_PASSWORD` y en `ConnectionStrings__DefaultConnection`.

### 2.5 Deploy

Click en **Deploy the stack**

Esto va a:
1. Clonar el repo
2. Crear la base de datos
3. Ejecutar el script de inicialización (crea usuarios Leo y Anto)
4. Build e iniciar los servicios

**Tarda 3-5 minutos la primera vez.**

---

## Paso 3: Verificar que Funcionó

### 3.1 Ver contenedores

En Portainer → **Containers**, deberías ver 4 corriendo:
- `expense-tracker-db` ✅
- `expense-tracker-backend` ✅
- `expense-tracker-pdf-parser` ✅
- `expense-tracker-frontend` ✅

### 3.2 Verificar usuarios creados

1. Andá a **Containers** → `expense-tracker-db`
2. Click en **Console** → **Connect**
3. Ejecutá:

```bash
psql -U postgres -d expensetracker -c 'SELECT "Name", "Slug", "Initial", "Color" FROM "Users";'
```

Deberías ver:
```
 Name | Slug | Initial |  Color
------+------+---------+----------
 Leo  | leo  | L       | #6366f1
 Anto | anto | A       | #ec4899
```

### 3.3 Acceder a la aplicación

Desde tu navegador:
- **App**: `http://IP_DE_TU_SERVIDOR:3500`
- **API**: `http://IP_DE_TU_SERVIDOR:3501`
- **Swagger**: `http://IP_DE_TU_SERVIDOR:3501/swagger`

---

## Paso 4: Probar Deploy Automático

Hacé un cambio y pusheá:

```bash
# En tu máquina local
git add .
git commit -m "Test deploy automático"
git push origin main
```

En ~5 minutos, Portainer detectará el cambio y redeployará.

---

# Opción B: GitHub Actions + SSH

## Paso 1: Generar SSH Key en tu servidor

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions  # Copiá TODO el contenido
```

## Paso 2: Configurar Secrets en GitHub

En tu repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret Name | Valor |
|-------------|-------|
| `SERVER_IP` | IP de tu servidor |
| `SERVER_USER` | tu usuario |
| `SSH_PRIVATE_KEY` | Contenido de `~/.ssh/github_actions` |

## Paso 3: Preparar el servidor

```bash
# Crear directorio
sudo mkdir -p /opt/family-expense-tracker
sudo chown $USER:$USER /opt/family-expense-tracker
cd /opt/family-expense-tracker

# Crear archivo .env
nano .env
```

Contenido del `.env`:
```bash
POSTGRES_DB=expensetracker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_muy_segura_aqui
ConnectionStrings__DefaultConnection=Host=db;Port=5432;Database=expensetracker;Username=postgres;Password=tu_password_muy_segura_aqui
FRONTEND_PORT=3500
BACKEND_PORT=3501
```

## Paso 4: Probar

Hacé push a `main` o ejecutá manualmente el workflow en GitHub → Actions.

---

# Opción C: GitHub Actions + Portainer Webhook

## Paso 1: Crear Stack en Portainer

En Portainer → **Stacks** → **Add Stack** → **Web editor**:

Copiá el contenido de `docker-compose.portainer.yml` del repo.

En **Environment variables**, agregá las mismas variables que en la Opción A.

Después de crear el stack, copiá la **Webhook URL** (aparece en el editor del stack).

## Paso 2: Configurar GitHub Secrets

| Secret Name | Valor |
|-------------|-------|
| `PORTAINER_WEBHOOK_URL` | La URL del webhook que copiaste |

## Paso 3: Configurar GHCR en Portainer

1. Andá a **Registries** → **Add registry**
2. Type: **Custom**
3. Name: `ghcr.io`
4. Registry URL: `ghcr.io`
5. Authentication: ON
6. Username: tu usuario de GitHub
7. Password: Personal Access Token con `read:packages`

---

## 🛠️ Solución de Problemas

### Los usuarios no aparecen en la base de datos

El script de inicialización solo corre cuando la base de datos se crea por primera vez.

**Para recrear la DB con los usuarios:**

```bash
# En el servidor
docker compose -f docker-compose.prod.yml down -v  # Borra todo
docker compose -f docker-compose.prod.yml up -d    # Recrea todo
```

⚠️ Esto borra todos los datos.

### Para insertar usuarios manualmente (sin borrar datos):

```bash
# Conectarse al contenedor de DB
docker exec -it expense-tracker-db psql -U postgres -d expensetracker

# Insertar usuarios
INSERT INTO "Users" ("Id", "Name", "Slug", "Initial", "Color", "CreatedAt")
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Leo', 'leo', 'L', '#6366f1', NOW()),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Anto', 'anto', 'A', '#ec4899', NOW())
ON CONFLICT ("Id") DO NOTHING;

# Salir
\q
```

### Error "relation Users does not exist"

Significa que las tablas no se crearon. El backend debería crearlas con migraciones. Verificá los logs del backend en Portainer.

### Puertos ocupados

```bash
# Ver qué usa el puerto
sudo lsof -i :3500

# Cambiar puertos en las environment variables:
FRONTEND_PORT=3600
BACKEND_PORT=3601
```

---

## 📁 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.prod.yml` | Configuración producción con build local |
| `docker-compose.portainer.yml` | Configuración usando imágenes GHCR |
| `database/init/01-seed-users.sql` | Script SQL que crea usuarios Leo y Anto |
| `.github/workflows/deploy.yml` | Deploy vía SSH |
| `.github/workflows/build-and-push.yml` | Build + push a GHCR |

---

## ✅ Checklist Final

- [ ] Docker instalado en el servidor
- [ ] Portainer corriendo y accesible
- [ ] Stack creado en Portainer
- [ ] Variables de entorno configuradas
- [ ] Stack deployado exitosamente
- [ ] Usuarios Leo y Anto creados en la DB
- [ ] Aplicación accesible en puerto 3500
- [ ] Probado el deploy automático
