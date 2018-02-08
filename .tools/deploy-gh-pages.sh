#!/bin/bash

# Ensure script exec in project root
cd "`dirname \"$0\"`" && cd ..

# Remove exising output folder
rm -rf out || exit 0;

# Recreate output folder
mkdir -p out/docson;

# Copy docson files
cp -R bower_components/docson/css bower_components/docson/lib bower_components/docson/templates bower_components/docson/docson.js bower_components/docson/index.html bower_components/docson/widget.js out/docson/
# Generate all rules
./node_modules/.bin/babel-node ./.tools/rules-generate.js
# Copy drafts
cp -R draft-* legacy out/
# Remove rules templates & tests
find out/ -type f -name "*.bolt" -exec rm -f {} \;
find out/ -type f -name "test-*" -exec rm -f {} \;
# Copy README & LICENSE
cp README.md LICENSE out/
# Generate index
node ./.tools/index-generate.js

cd out
git init
#git config user.name "webcomOps"
#git config user.email "webcom.ops@orange.com"
git config user.name "flbbzh"
git config user.email "franck.lebris@orange.com"
git add .
git commit -m "Deploy to GitHub Pages"
echo "https://${GH_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git"
git push --force --quiet "https://${GH_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git" master:gh-pages > /dev/null 2>&1
