package main

import (
	// "fmt"
	"net/http"
	"encoding/json"
	"math/rand"
	"os"
	"os/signal"
	"syscall"
	"time"
	"context"
	"log"

	"github.com/gorilla/mux"
)

type Dog struct {
	Name string	`json:"name"`
	Age int		`json:"age"`
	Toy *Toy	`json:"toy,omitempty"`
}

type Toy struct { 
	Name string		`json:"name"`
	Color string	`json:"color"`
}

var dogNames = []string{"Rex", "Max", "Molly", "Loki", "Jax"}
var toyNames = []string{"Tennis Ball", "Rope", "Bear", "Dumbell"}
var toyColors = []string{"Red", "Yellow", "Blue", "Green", "Brown"}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/dogs/{name}", handleGetDog).Methods("GET")
	r.HandleFunc("/dogs", handleGetDogs).Methods("GET")
	server := &http.Server{
		Handler:      r,
		Addr:         ":8080",
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	}

	go func() {
		log.Println("Starting server")
		if err := server.ListenAndServe(); err != nil {
			log.Fatal(err)
		}
	}()

	waitForShutdown(server)
}

func handleGetDog(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	name := vars["name"]
	dog := Dog {
		Name: name,
		Age: rand.Intn(20),
		Toy: &Toy{
			Name: toyNames[rand.Intn(len(toyNames))],
			Color: toyColors[rand.Intn(len(toyColors))],
		},
	}
	res, err := json.Marshal(dog)
	if (err != nil) {
		panic(err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
}

func handleGetDogs(w http.ResponseWriter, r *http.Request) {
	dogs := []Dog{}
	for _, dogName := range dogNames {
		dogs = append(dogs, 
			Dog{
				Name: dogName,
				Age: rand.Intn(20),
			},
		)
	}
	res, err := json.Marshal(dogs)
	if (err != nil) {
		panic(err)
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(res)
}

func waitForShutdown(server *http.Server) {
	interruptChan := make(chan os.Signal, 1)
	signal.Notify(interruptChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	
	<-interruptChan

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	server.Shutdown(ctx)

	log.Println("Shutting down")
	os.Exit(0)
}