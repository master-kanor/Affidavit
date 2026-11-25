# Open Connect AI Factory — Cloud Browser
FROM mcr.microsoft.com/playwright:v1.55.0-focal

WORKDIR /workspace/browser

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV CHROME_BIN=/ms-playwright/chromium-1187/chrome-linux/chrome
ENV DISPLAY=:99

# Install Xvfb for headless browser
RUN apt-get update && apt-get install -y \
    xvfb \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 9222

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9222/json/version || exit 1

CMD ["sh", "-c", "Xvfb :99 -screen 0 1920x1080x24 & npx playwright test --host 0.0.0.0 --port 9222"]
