
all: lint

lint:
	./node_modules/.bin/jshint ./ && ./node_modules/.bin/jscs ./

.PHONY: lint