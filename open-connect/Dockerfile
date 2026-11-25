# Open Connect AI Factory — Docker Runtime
# Isolated agent execution environment with all tooling.
FROM node:24-alpine

WORKDIR /workspace/app

# Install system dependencies for Chromium/Playwright
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
    g++

# Install Playwright browser dependencies
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV CHROME_BIN=/usr/bin/chromium-browser

# Copy project files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Install Playwright Chromium
RUN pnpm exec playwright install chromium --with-deps

# Expose ports
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["pnpm", "dev"]
