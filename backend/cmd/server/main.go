package main

import "log"

func main() {
	server := newServer(":8080")

	log.Println("server starting on http://localhost:8080")
	err := server.ListenAndServe()
	if err != nil {
		log.Fatal(err)
	}
}
