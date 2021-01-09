sources = core plugins .

all:
	@make lint fmt test

lint:
	deno lint --unstable $(sources)

fmt:
	deno fmt --check $(sources)

test:
	deno test --failfast $(sources)
