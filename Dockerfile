# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npx ng build --configuration production

# Stage 2: Serve
FROM nginx:alpine
LABEL net.unraid.docker.icon="https://raw.githubusercontent.com/dkoeb/labyrinth/main/public/labyrinth-icon.svg"
COPY --from=build /app/dist/labyrinth/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
