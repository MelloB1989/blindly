package cmd

import (
	"blindly/internal/constants"
	"blindly/internal/graph"
	"context"
	"log"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/MelloB1989/karma/config"
	"github.com/gorilla/websocket"
	"github.com/vektah/gqlparser/v2/ast"
)

func StartGraphql(ctx context.Context) error {
	port := "7777"
	srv := handler.New(graph.NewExecutableSchema(graph.Config{Resolvers: graph.NewResolver()}))

	// Add transports in the correct order
	srv.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				origin := r.Header.Get("Origin")
				log.Printf("WebSocket upgrade request from origin: %s", origin)

				// Check against allowed origins
				allowedOrigins := constants.GetAllowedOrigins()
				if slices.Contains(allowedOrigins, origin) {
					return true
				}

				if origin == "" {
					token := r.Header.Get("INTERNAL_APP_KEY")
					if strings.HasPrefix(token, config.GetEnvRaw("INTERNAL_API_KEY")) {
						return true
					}
				}

				// Log rejected origins
				log.Printf("WebSocket connection rejected from origin: %s", origin)
				return false
			},
		},
	})
	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.SSE{
		KeepAlivePingInterval: 10 * time.Second,
	})

	srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))
	srv.Use(extension.Introspection{})
	srv.Use(extension.AutomaticPersistedQuery{
		Cache: lru.New[string](100),
	})

	// Enhanced middleware with WebSocket detection and CORS
	withMiddleware := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers for all requests
		setCORSHeaders(w, r)

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Check if this is a WebSocket upgrade request
		if r.Header.Get("Upgrade") == "websocket" {
			log.Println("WebSocket upgrade request detected")
			log.Printf("Origin: %s", r.Header.Get("Origin"))
		}

		ctx := context.WithValue(r.Context(), "httpRequest", r)
		r = r.WithContext(ctx)
		srv.ServeHTTP(w, r)
	})

	// Configure playground with subscription endpoint
	playgroundHandler := playground.Handler("GraphQL playground", "/query")

	// Create a custom playground config that supports subscriptions
	customPlaygroundHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers for playground
		setCORSHeaders(w, r)
		// Override methods for playground specific needs
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, authorization, Connection, Upgrade, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol, Cache-Control, X-N8n-Url, X-N8n-Action, X-N8n-Session, Chatkit-Frame-Instance-Id")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		playgroundHandler.ServeHTTP(w, r)
	})

	// Create a new HTTP mux for GraphQL server
	mux := http.NewServeMux()
	mux.Handle("/", customPlaygroundHandler)
	mux.Handle("/query", withMiddleware)

	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	go func() {
		<-ctx.Done()
		log.Println("Shutting down GraphQL server...")
		server.Shutdown(context.Background())
	}()

	log.Printf("GraphQL server starting on port %s", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}
	return nil
}
