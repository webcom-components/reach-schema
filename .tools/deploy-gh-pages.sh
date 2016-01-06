#!/bin/bash

# Ensure script exec in project root
cd "`dirname \"$0\"`" && cd ..

# Remove exising output folder
rm -rf out || exit 0;

# Recreate output folder
mkdir out;

# Copy docson files
cp -R bower_components/docson/css bower_components/docson/lib bower_components/docson/templates bower_components/docson/docson.js bower_components/docson/index.html bower_components/docson/widget.js out/
# Copy drafts
cp -R draft-* legacy out/
# Copy latest draft
cp -R $(node ./.tools/export.js) out/latest
# Copy README & LICENSE
cp README.md LICENSE out/

#cd out
#git init
#git config user.name "webcomOps"
#git config user.email "webcom.ops@orange.com"
#git add .
#git commit -m "Deploy to GitHub Pages"
#git push --force --quiet "https://${GH_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git" master:gh-pages > /dev/null 2>&1