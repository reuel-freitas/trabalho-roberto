FROM node:20-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN corepack enable \
    && corepack prepare pnpm@10.17.1 --activate \
    && pnpm config set package-import-method copy \
    && pnpm config set store-dir /tmp/pnpm-store \
    && pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

RUN corepack enable \
    && pnpm add vite

EXPOSE 4173
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]

