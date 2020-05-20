#!/bin/bash

# override CircleCi's default run settings,
# so that we run all tests and do not exit early
# on test failures.
set +e
set +o pipefail

EXIT_STATE=0
MAX_AUTO_RETRY=2

# inspired by https://unix.stackexchange.com/a/82602
retry () {
    local n=0

    until [ $n -ge $MAX_AUTO_RETRY ]; do
        "$@" && break
        n=$[$n+1]
        echo ''
        echo run $n of $MAX_AUTO_RETRY failed, trying again ...
        echo ''
        sleep 15
    done

    if [ $n -eq $MAX_AUTO_RETRY ]; then
        EXIT_STATE=1
    fi
}

npm run pretest
npm run test:lint || EXIT_STATE=$?
npm run test:unit || EXIT_STATE=$?
retry npm run test:integration
exit $EXIT_STATE
