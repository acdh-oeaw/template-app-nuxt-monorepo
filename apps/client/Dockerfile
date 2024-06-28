# syntax=docker/dockerfile:1

# using alpine base image to avoid `sharp` memory leaks.
# @see https://sharp.pixelplumbing.com/install#linux-memory-allocator

# base
FROM node:20-alpine AS base

RUN corepack enable

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

RUN pnpm add --global turbo@2

COPY --chown=node:node .npmrc package.json pnpm-lock.yaml ./

RUN pnpm fetch

COPY --chown=node:node ./ ./

RUN turbo prune @acdh-oeaw/app-client --docker

ARG NUXT_PUBLIC_APP_BASE_URL
ARG NUXT_PUBLIC_BOTS
ARG NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ARG NUXT_PUBLIC_MATOMO_BASE_URL
ARG NUXT_PUBLIC_MATOMO_ID
ARG NUXT_PUBLIC_REDMINE_ID

# deps
FROM node:20-alpine AS build

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

COPY .gitignore .gitignore
COPY --from=base --chown=node:node /app/out/json/ .
COPY --from=base --chown=node:node /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile --offline

ENV NODE_ENV=production

COPY --from=base --chown=node:node /app/out/full/ .

RUN pnpm turbo run base --filter=@acdh-oeaw/app-client

# serve
FROM node:20-alpine AS serve

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

COPY --from=build --chown=node:node /app/.output ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "./server/index.mjs"]
