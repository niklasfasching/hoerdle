.PHONY: $(shell ls)

build:
	go build -o hoerdle *.go
