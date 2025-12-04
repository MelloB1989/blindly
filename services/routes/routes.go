package routes

import (
	"blindly/internal/handlers/fs"
	"blindly/internal/middlewares"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func Routes() *fiber.App {
	app := fiber.New(fiber.Config{
		BodyLimit:             8000 * 1024 * 1024,
		DisableStartupMessage: true,
	})
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, X-Karma-Admin-Auth",
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
	}))
	v1 := app.Group("/v1")

	fsRoutes := v1.Group("/fs")
	fsRoutes.Post("/upload", middlewares.IsUserVerified, fs.StoreUserFile)

	return app
}
