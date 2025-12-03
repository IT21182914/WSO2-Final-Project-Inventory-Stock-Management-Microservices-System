FROM node:18-alpine

WORKDIR /app

# Install build dependencies for native modules like bcrypt
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild native modules
RUN npm install && npm rebuild bcrypt --build-from-source

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "src/server.js"]
