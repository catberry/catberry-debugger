
all: lint

lint:
	./node_modules/.bin/jshint ./ && ./node_modules/.bin/jscs ./

package:
	./node_modules/.bin/crx pack ./src -o ./bin/catberry-debugger.crx --zip-output ./bin/catberry-debugger.zip -p ./bin/catberry-debugger.pem

.PHONY: lint
