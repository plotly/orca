#!/bin/bash

# override CircleCi's default run settings,
# so that we run all tests and do not exit early
# on test failures.
set +e
set +o pipefail

./test/image/render_mocks_cli build/test_images
./test/image/compare_images test/image/baselines build/test_images build/test_images_diff
