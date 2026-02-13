# Dockerfile for Corvus MCP Server
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built dist and other necessary files
COPY dist ./dist
COPY src/data ./src/data

# Set environment variables (will be overridden by Archestra)
ENV NODE_ENV=production

# Expose port if needed (MCP uses stdio, so not strictly necessary)
# EXPOSE 3000

# Run the MCP server
CMD ["node", "dist/index.js"]
