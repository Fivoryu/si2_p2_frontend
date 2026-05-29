FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG API_URL=http://localhost:8000
ARG WS_URL=ws://localhost:8000
RUN sed -i "s|http://localhost:8000|${API_URL}|g" src/environments/environment.prod.ts \
    && sed -i "s|ws://localhost:8000|${WS_URL}|g" src/environments/environment.prod.ts

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/emergencias-web/browser /usr/share/nginx/html

EXPOSE 80
