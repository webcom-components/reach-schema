#!/bin/bash

rm -rf out || exit 0;

mkdir out;
cp -R bower_components/docson/* out/
cp -R draft-* out/
cp -R $LATEST_DRAFT out/latest

cd out
git init
git config user.name "webcomOps"
git config user.email "webcom.ops@orange.com"
git add .
git commit -m "Deploy to GitHub Pages"
git push --force --quiet "https://${GH_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git" master:gh-pages > /dev/null 2>&1