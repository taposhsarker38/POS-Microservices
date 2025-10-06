# Stage 1 - install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production


# Stage 2 - build
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm run build


# Stage 3 - run
FROM node:20-alpine AS runner
WORKDIR /app
ENV PORT=3000
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm","start"]