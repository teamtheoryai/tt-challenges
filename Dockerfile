# Shared image for every Node service (api, agent, pipeline, seeder, web).
# The compose file passes APP=apps/<name>; the container runs that workspace.
FROM node:20-alpine

WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps
COPY scripts ./scripts

RUN npm install --no-audit --no-fund

ARG APP
ENV APP=${APP}

CMD ["sh", "-c", "npm --workspace ${APP} run start"]
