package logger

import (
	"log"

	"github.com/fatih/color"
)

func (l *Logger) Startup() {
	c := color.New(color.FgCyan).Add(color.Underline)
	color.RGB(174, 52, 235).Print(`
________  ___       ___  ________   ________  ___           ___    ___
|\   __  \|\  \     |\  \|\   ___  \|\   ___ \|\  \         |\  \  /  /|
\ \  \|\ /\ \  \    \ \  \ \  \\ \  \ \  \_|\ \ \  \        \ \  \/  / /
\ \   __  \ \  \    \ \  \ \  \\ \  \ \  \ \\ \ \  \        \ \    / /
 \ \  \|\  \ \  \____\ \  \ \  \\ \  \ \  \_\\ \ \  \____    \/  /  /
  \ \_______\ \_______\ \__\ \__\\ \__\ \_______\ \_______\__/  / /
   \|_______|\|_______|\|__|\|__| \|__|\|_______|\|_______|\___/ /
                                                          \|___|/
`)
	c.Println("Blindly v0.0.1")
	log.Println("Server started")
	log.Println("Graphql running on port 7777")
	log.Println("Mock server running on port 8080")
}
