FROM node:18-alpine
WORKDIR /app

# Upgrade npm to latest compatible with Node 18 and fix glob vulnerability CVE-2025-64756
RUN npm install -g npm@10.9.2 && \
    npm cache clean --force

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "src/server.js"]
