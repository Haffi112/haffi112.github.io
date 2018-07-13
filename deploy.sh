git add .
git commit -a -m "Deploy."
git push
jekyll build --destination haffi112.github.io
cd haffi112.github.io
git add .
git commit -a -m "Deploy."
git push --force
