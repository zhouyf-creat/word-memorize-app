# Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies including devDependencies for building
RUN npm ci

# Copy source files
COPY . .

# Build the frontend and backend server bundle
RUN npm run build

# Production runner image
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./index.html

# Expose server port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
