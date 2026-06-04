# Stage 1: Build the React client assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Expose Express API server and serve static assets
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.cjs ./server.cjs

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "server.cjs"]
