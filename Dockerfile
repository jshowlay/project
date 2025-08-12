# Build
FROM node:20-bullseye AS build
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY .npmrc* ./
RUN npm ci || (npm install)
COPY . .
RUN npx prisma generate
RUN npm run build

# Run
FROM node:20-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "start"]
