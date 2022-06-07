#!/bin/bash
set -e -u -o pipefail

project_url="https://github.com/dhis2/capture-app"
tag="v100.5.6"
echo "Get capture-app: $project_url (tag $tag)"
svn export -q --force "$project_url/tags/$tag/src/core_modules" src/data/capture-core-modules

echo "Create node_modules links"
ln -sf ../src/data/capture-core-modules/capture-core/ node_modules/
ln -sf ../src/data/capture-core-modules/capture-core-utils/ node_modules/

echo "Clean flow types"
npx flow-remove-types -q --out-dir src/data/capture-core-modules src/data/capture-core-modules
rm -rf src/data/capture-core-modules/capture-core/flow
find src/data/capture-core-modules -type f -print0 | xargs -0 awk -i inplace '!/^export type/'
