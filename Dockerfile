# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .



# Expose ports for backend and frontend
EXPOSE 4000 3000

# The command to run both client and server concurrently
CMD ["npm", "run", "dev"]
