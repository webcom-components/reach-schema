#!/bin/bash

# Ensure script exec in project root
cd "`dirname \"$0\"`" && cd ..

# Remove exising output folder
rm -rf out || exit 0;

# Recreate output folder
mkdir out;

# Copy docson files
cp -R bower_components/docson/* out/
# Copy drafts
cp -R draft-* out/
# Copy latest draft
cp -R $(node ./.tools/export.js) out/latest

cd out
git init
git config user.name "webcomOps"
git config user.email "webcom.ops@orange.com"
git add .
git commit -m "Deploy to GitHub Pages"
git push --force --quiet "https://${GH_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git" master:gh-pages > /dev/null 2>&1