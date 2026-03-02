# Backend Dockerfile for Cloud Run
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --only=production

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY tsc-alias.json ./
COPY src/ ./src/

# Build the application
RUN npm run build

# Remove dev dependencies and source after build
RUN rm -rf src/ tsconfig.json tsc-alias.json node_modules/
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S stackspay -u 1001

# Change ownership
RUN chown -R stackspay:nodejs /app
USER stackspay

# Expose port (Cloud Run uses PORT env var)
EXPOSE 8080
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1# Start the application
CMD ["node", "dist/index.js"]
