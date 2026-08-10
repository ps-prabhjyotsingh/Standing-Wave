# Standing Wave: build the static site, then hand it to nginx and get out of the way.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# The only thing the site needs to know about where it lives. Canonical links, the
# sitemap and the feed are built from it; nothing else in the source mentions a domain.
ARG SITE_URL=http://localhost:8480
ENV SITE_URL=$SITE_URL

RUN npm run build \
  && node scripts/verify-dist.mjs \
  && node scripts/csp-header.mjs > /app/csp.conf


FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/csp.conf /etc/nginx/csp.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY headers.conf /etc/nginx/headers.conf

RUN nginx -t

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1
