
# Stage 1: Building the code
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time environment variables for Next.js
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY_TEST=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
ARG NEXT_PUBLIC_API_URL=http://localhost:8001/api
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY_TEST=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY_TEST
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build
RUN npm run build

# Stage 2: Run the production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
# Next.js Standalone build (requires output: 'standalone' in next.config.mjs usually)
# If standalone not configured, we copy .next and node_modules (heavier)
# For now let's assume standard build and use 'npm start' or copy standalone if we configure it.
# Let's configure standalone in next.config.mjs for best docker practice.

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
