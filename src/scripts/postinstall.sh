#!/bin/bash
set -e -u -o pipefail

project_url="https://github.com/dhis2/capture-app"
ref="tags/v100.5.6"
echo "Get capture-app: $project_url ($ref)"
svn export -q --force "$project_url/$ref/src/core_modules"

echo "Clean flow types"
npx flow-remove-types -q --out-dir core_modules core_modules
rm -rf core_modules/capture-core/flow
find core_modules/ -type f -print0 | xargs -0 awk -i inplace '!/^export type/'
awk -i inplace '!/^\s*(converterObject|processValue)\s*;?\s*$/' \
    core_modules/capture-core-utils/rulesEngine/processors/ValueProcessor.js

echo "Move folders"
mv core_modules/capture-core src
mv core_modules/capture-core-utils src
