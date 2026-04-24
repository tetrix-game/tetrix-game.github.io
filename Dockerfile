# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Create a clean .npmrc that uses public registry
RUN echo "registry=https://registry.npmjs.org/" > /root/.npmrc

# Install dependencies (skip the local eslint plugin)
RUN npm install --legacy-peer-deps --ignore-scripts || npm install --legacy-peer-deps --no-optional

# Copy source files
COPY . .

# Build the app (skip linting)
RUN npm run build:prod

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start the app
CMD ["serve", "-s", "dist", "-l", "3000"]
