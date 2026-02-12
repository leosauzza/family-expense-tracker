FROM node:20-alpine

WORKDIR /app

# Install dependencies for canvas (if needed by pdf.js) and wget for healthcheck
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    wget

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 3001

# Start the service
CMD ["npm", "start"]
