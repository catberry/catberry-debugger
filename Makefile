
all: lint

lint:
	./node_modules/.bin/eslint ./

lint-fix:
	./node_modules/.bin/eslint ./ --fix

package:
	./node_modules/.bin/crx pack ./src -o ./bin/catberry-debugger.crx --zip-output ./bin/catberry-debugger.zip -p ./bin/catberry-debugger.pem

.PHONY: lint
