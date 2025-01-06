
# For players:

- 🌱 I'm building this for free so anyone can train the brain without ads.
- 📫 How to reach me: If you've found this page, you're halfway there!. Anyone can open an issue in github. If you've never done it before, go ahead and try. I believe in you. Stuck? Google it :)

# For Developers:

my wishlist for you is that you be using: vscode, nvm, npm, a mac laptop running Sequoia
- that way, you'll be able to open your workspace settings in vscode, and paste this:
```javascript
{
  "editor.defaultFormatter": "vscode.typescript-language-features",
  "editor.formatOnSave": true,
}
```

1. Clone the repo
```javasctipt
git clone https://github.com/tetrix-game/tetrix-game.github.io
```
2. Open the project and run the following:
```javascript
npm install
```

3. Make changes

4. If you want your code to show up on the main branch, just, commit, and push.

5. If you want your code to go live, run (from the main branch)
```javascript
npm run publish
```
- That will compile the .ts files, create a /dist foler, and publish that dist folder to the 'gh-pages' branch, which is purely for serveing the code for players to play the game.

6. We're playing it fast and loose with privledges and branch protection, go ahead and commit directly to main, break the app, users won't care... right?

7. If you want to fix typscript errors, you're a better person than me. Feel free