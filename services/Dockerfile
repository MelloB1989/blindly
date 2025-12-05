FROM alpine:latest

RUN apk --no-cache add \
    ffmpeg \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

WORKDIR /app

COPY blindly .

COPY .env .

RUN sed -i 's/^ENVIRONMENT="DEV"/# ENVIRONMENT="DEV"/' .env

RUN chmod +x blindly

RUN addgroup -g 1001 appgroup && \
    adduser -D -u 1001 -G appgroup appuser && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 9000

CMD ["./blindly"]
