sources = core plugins .

all:
	@make lint fmt test

lint:
	deno lint $(sources)

fmt:
	deno fmt --check $(sources)

test:
	deno test --failfast $(sources)
