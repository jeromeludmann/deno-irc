sources = **/*.ts
test_sources = core/*_test.ts plugins/*_test.ts

all:
	@make lint fmt test

lint:
	deno lint $(sources)

fmt:
	deno fmt --check $(sources)

test:
	deno test --failfast $(test_sources)
