# Open Connect AI Factory — Isolated Sandbox
FROM node:24-alpine

WORKDIR /workspace/sandbox

# Install minimal system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    npm \
    pnpm \
    git \
    python3 \
    make \
    g++ \
    curl \
    wget

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV NODE_ENV=production

# Install Playwright Chromium
RUN pnpm exec playwright install chromium --with-deps

# Create non-root user for isolation
RUN addgroup -S sandbox && adduser -S sandbox -G sandbox
USER sandbox

# Expose port for sandbox API
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "sandbox-server.js"]
