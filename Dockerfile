# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clear any existing npm config and force public registry
RUN rm -rf /root/.npmrc ~/.npmrc 2>/dev/null || true && \
    npm config delete registry 2>/dev/null || true && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config list

# Install dependencies (skip the local eslint plugin)
RUN npm install --legacy-peer-deps --ignore-scripts || npm install --legacy-peer-deps --no-optional

# Copy source files
COPY . .

# Load environment variables from .env.production file for build
# This ensures VITE_API_URL is available to Vite during build
RUN if [ -f .env.production ]; then \
      export $(cat .env.production | grep -v '^#' | xargs) && \
      echo "Loaded VITE_API_URL from .env.production: $VITE_API_URL"; \
    fi

# Build the app (skip linting)
# Note: Vite will read VITE_API_URL from .env.production automatically
RUN npm run build:prod

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port (Railway will set PORT env var)
EXPOSE 3000

# Start the app (use PORT env var or default to 3000)
CMD sh -c "serve -s dist -l ${PORT:-3000}"
