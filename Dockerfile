# ==========================================
# STAgE 1: Entorno de Construcción
# ==========================================
FROM node:20-bullseye AS builder

# Instalar dependencias del sistema requeridas por unixODBC y node-gyp
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    build-essential \
    python3 \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# Agregar repositorio oficial de Microsoft e instalar ODBC 17
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/microsoft-prod.gpg \
    && curl -fsSL https://packages.microsoft.com/config/debian/11/prod.list | tee /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql17 mssql-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar las librerías de Node.JS (Esto compilará C++ bindings de msnodesqlv8 nativamente en Linux)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar y compilar la aplicación Next.js
COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Entorno Limpio de Producción
# ==========================================
FROM node:20-bullseye AS runner

WORKDIR /app

# Variables globales de Next.js
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 1. Instalar las librerías base de ODBC usando la versión completa para coincidir con Builder
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg2 \
    unixodbc \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/microsoft-prod.gpg \
    && curl -fsSL https://packages.microsoft.com/config/debian/11/prod.list | tee /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y msodbcsql17 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Copiar lo construido en el Stage 1 para purgar el compilador de C++/Python (reduce peso)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Levantar Next.js de producción
CMD ["npm", "run", "start"]
