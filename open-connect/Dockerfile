# Open Connect AI Factory — Docker Runtime
FROM node:24-alpine

WORKDIR /workspace/app/open-connect

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    git \
    python3 \
    make \
    g++ \
    curl

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV NODE_ENV=production

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["npm", "start"]
