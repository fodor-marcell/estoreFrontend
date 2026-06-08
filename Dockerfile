FROM node:20-alpine AS builder

WORKDIR /app

# Másold a package.json fájlokat
COPY package*.json ./

# Telepítsd a függőségeket
RUN npm ci

# Másold a teljes forráskódot
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Buildeld a frontendet
RUN npm run build

# Production stage
FROM nginx:alpine

# Másold a buildelt fájlokat
COPY --from=builder /app/dist /usr/share/nginx/html

# Másold a Nginx konfig template-et
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Telepítsd az envsubst-t (alpine-ban már alapból van a gettext-ben)
RUN apk add --no-cache gettext

EXPOSE 80

# CMD: envsubst behelyettesíti a BACKEND_URL változót a template-be
CMD envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'