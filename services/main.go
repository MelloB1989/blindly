package main

import (
	"blindly/internal/cmd"
	"blindly/internal/logger"
	mockserver "blindly/mock_server"
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

var Version = "dev" // overridden at build/run time

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		if err := mockserver.StartMockServer(ctx); err != nil {
			log.Printf("mockserver returned error: %v", err)
		}
	}()
	go func() {
		if err := cmd.StartGraphql(ctx); err != nil {
			log.Printf("graphql returned error: %v", err)
		}
	}()

	l := logger.NewLogger()
	l.Startup(Version)

	// Wait for SIGINT or SIGTERM
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	log.Println("shutdown signal received — cancelling context")
	cancel()

	time.Sleep(2 * time.Second)

	log.Println("graceful shutdown complete")
}
