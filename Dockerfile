# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose the app port (default: 5000)
EXPOSE 5000

# Start the app
CMD ["npm", "start"] 