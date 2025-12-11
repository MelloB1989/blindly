# Build stage
FROM golang:1.24-alpine AS builder

RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    git

WORKDIR /build

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o blindly .

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy built binary from builder stage
COPY --from=builder /build/blindly .

RUN chmod +x blindly

RUN addgroup -g 1001 appgroup && \
    adduser -D -u 1001 -G appgroup appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 9000

CMD ["./blindly"]
