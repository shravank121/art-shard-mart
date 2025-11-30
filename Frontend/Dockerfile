# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for environment variables
ARG VITE_API_URL=http://localhost:4000
ARG VITE_SEPOLIA_MARKETPLACE_ADDRESS

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SEPOLIA_MARKETPLACE_ADDRESS=$VITE_SEPOLIA_MARKETPLACE_ADDRESS

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
