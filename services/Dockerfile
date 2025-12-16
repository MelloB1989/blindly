# Build stage
FROM golang:1.24-alpine AS builder

ARG VERSION=dev

RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    git

WORKDIR /build

# Copy go mod files first for better caching
COPY services/go.mod services/go.sum ./
RUN go mod download

# Copy source code
COPY services/ .

# Build the binary with version
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s -X main.Version=${VERSION}" -o blindly .

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy built binary from builder stage
COPY --from=builder /build/blindly .

# Copy .env file from root context
COPY .env* ./

RUN chmod +x blindly

RUN addgroup -g 1001 appgroup && \
    adduser -D -u 1001 -G appgroup appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 9000

CMD ["./blindly"]
