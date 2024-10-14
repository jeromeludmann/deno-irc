all_sources = **/*.ts
test_sources = core/*_test.ts plugins/*_test.ts
exclude_from_coverage = --exclude="_test\.ts" --exclude="/testing/"

default:
	$(MAKE) lint fmt-check test-coverage

lint:
	deno lint $(all_sources)

fmt:
	deno fmt $(all_sources)

fmt-check:
	deno fmt --check $(all_sources)

test:
	deno test --failfast $(test_sources) --parallel

test-coverage:
	make clean
	deno test --parallel --coverage=coverage/cov_profile $(test_sources)
	deno coverage $(exclude_from_coverage) coverage/cov_profile

test-coverage-html:
	@command -v genhtml >/dev/null || (echo "ERROR: genhtml not found: lcov is required"; exit 1)
	make clean
	deno test --coverage=coverage/cov_profile $(test_sources)
	deno coverage $(exclude_from_coverage) --lcov coverage/cov_profile > coverage/cov.lcov
	genhtml -o coverage/html_cov coverage/cov.lcov
	open coverage/html_cov/index.html

clean:
	rm -rf coverage

help:
	@echo "default               run lint fmt fmt-check test-coverage"
	@echo "lint                  lint files"
	@echo "fmt                   format files"
	@echo "fmt-check             check format"
	@echo "test                  test files"
	@echo "test-coverage         test files and print coverage report"
	@echo "test-coverage-html    test files and open HTML coverage report"
	@echo "clean                 remove temporary files"
