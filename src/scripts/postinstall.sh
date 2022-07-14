#!/bin/bash
set -e -u -o pipefail

project_url="https://github.com/dhis2/capture-app"
ref="tags/v100.5.6"
echo "Get capture-app: $project_url ($ref)"
svn export -q --force "$project_url/$ref/src/core_modules"

echo "Clean flow types"
npx flow-remove-types -q --ignore-uninitialized-fields --out-dir core_modules core_modules
rm -rf core_modules/capture-core/flow
# Manually remove statements "export type ...", which are kept by flow-remove-types
find core_modules/ -type f -print0 | xargs -0 awk -i inplace '!/^export type/'

echo "Move folders to ./src"
rm -rf src/{capture-core,capture-core-utils}
mv core_modules/capture-core src
mv core_modules/capture-core-utils src
