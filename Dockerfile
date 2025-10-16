# ---- Base Stage ----
# Use an official Node.js runtime as a parent image
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---- Builder Stage: Install all dependencies and build the frontend ----
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
# Build the frontend
RUN npm run build

# ---- Production Stage: Create the final, lean image ----
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production

# Set the timezone for the container to match your local environment
ENV TZ=Asia/Kolkata
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone


# Copy only the necessary production dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy the backend source code
COPY backend ./backend

# Copy the built frontend from the builder stage
COPY --from=builder /app/dist ./dist

WORKDIR /app/backend
CMD ["npm", "start"]
