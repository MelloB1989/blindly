package main

import mockserver "blindly/mock_server"

func main() {
	go mockserver.StartMockServer()
}
