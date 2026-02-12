# 🚀 Deployment Guide - Family Expense Tracker

Guía para configurar deploy automático a tu servidor Ubuntu con Portainer.

---

## 📋 Prerequisites

- Servidor Ubuntu con Docker instalado
- Portainer instalado y corriendo
- Cuenta de GitHub con este repositorio

---

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

> ⚠️ **IMPORTANTE**: 
> - Usá la misma contraseña en `POSTGRES_PASSWORD` y `ConnectionStrings__DefaultConnection`
> - Verificá que diga `Database` (no `Datbase`)

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

```bash
# En el servidor
docker exec expense-tracker-db psql -U postgres -d expensetracker \
  -c 'SELECT "Name", "Slug", "Initial" FROM "Users";'
```

Debería mostrar:
```
 Name | Slug | Initial
------+------+---------
 Leo  | leo  | L
 Anto | anto | A
```

### 3.3 Acceder a la aplicación

- **App**: `http://IP_DE_TU_SERVIDOR:3500`
- **API**: `http://IP_DE_TU_SERVIDOR:3501`
- **Swagger**: `http://IP_DE_TU_SERVIDOR:3501/swagger`

---

## Paso 4: Deploy Automático

Cada vez que hagas push a `main`:

```bash
git add .
git commit -m "Nuevos cambios"
git push origin main
```

En ~5 minutos, Portainer detectará el cambio y redeployará automáticamente.

---

## 🛠️ Solución de Problemas

### Error "relation Users does not exist"

Las tablas no se crearon. El backend debería crearlas automáticamente. Verificá:

```bash
# Ver logs del backend
docker logs expense-tracker-backend --tail 30
```

Si hay un error de typo (`Datbase` vs `Database`), corregí la variable `ConnectionStrings__DefaultConnection` en el stack.

Para reiniciar el stack:
1. Portainer → Stacks → `family-expense-tracker`
2. Click en **Stop this stack** → esperá
3. Click en **Start this stack**

### Insertar usuarios manualmente

Si necesitás crear los usuarios manualmente:

```bash
docker exec -i expense-tracker-db psql -U postgres -d expensetracker << 'EOF'
INSERT INTO "Users" ("Id", "Name", "Slug", "Initial", "Color", "CreatedAt")
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'Leo', 'leo', 'L', '#6366f1', NOW()),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Anto', 'anto', 'A', '#ec4899', NOW())
ON CONFLICT ("Id") DO NOTHING;
EOF
```

### Puertos ocupados

```bash
# Ver qué usa el puerto
sudo lsof -i :3500
```

Cambiá los puertos en las environment variables:
```
FRONTEND_PORT=3600
BACKEND_PORT=3601
```

---

## 📁 Archivos del Proyecto

| Archivo | Descripción |
|---------|-------------|
| `docker-compose.yml` | Desarrollo local |
| `docker-compose.prod.yml` | Producción (usado por Portainer) |
| `database/init/01-seed-users.sql` | Script que crea usuarios Leo y Anto |
| `.github/workflows/deploy.yml` | Backup: deploy vía SSH (no usado) |
