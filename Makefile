test:
	@./node_modules/.bin/mocha \
		--watch \
	  --require should

.PHONY: test
