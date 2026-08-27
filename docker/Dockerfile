FROM node:22-alpine AS development
RUN npm install -g pnpm
WORKDIR /usr/app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
USER node

FROM node:22-alpine AS build
RUN npm install -g pnpm
WORKDIR /usr/app
COPY package.json pnpm-lock.yaml* ./
COPY --from=development /usr/app/node_modules ./node_modules
COPY . .
RUN pnpm run build
ENV NODE_ENV production
RUN pnpm install --prod --no-frozen-lockfile
USER node

FROM node:22-alpine AS production
WORKDIR /usr/app
COPY --from=build /usr/app/node_modules ./node_modules
COPY --from=build /usr/app/dist ./dist
CMD ["node", "dist/main.js"]