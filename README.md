
# For players:

- 🔭 I’m currently working on this game. Known issues:
  - Failure happens when all the current shapes in their CURRENT orientation cannot be placed. Make it so only when no orientation can be placed, will you loose
  - You can go negative in your points, make it so going negative looses the game for you.
  - Difficulty levels should be implemented:
    - Hard: The game does not check to see if a newly generated shape can be placed on the current board
    - Normal: The game checks to see that each shape in isolation can be placed, but does not ensure that all three newly generated shapes can be placed
    - Easy: The game ensures that every newly generated shape can be placed. (I don't think it's possible to loose that version)
  - The turn button doesn't stop a shape from being placed... Kindof unusable, and super easy to fix... I don't even know why I'm writing this, I guess I just like checklists.
- 🌱 I’m currently learning full stack js.
- 📫 How to reach me: Anyone can open an issue in github. If you've never done it before, go ahead and try. I believe in you.

# For Developers:

my wishlist for you is that you be using: vscode, nvm, npm, a mac laptop running Sequoia

1. Clone the repo
```javasctipt
git clone https://github.com/tetrix-game/tetrix-game.github.io
```
2. Open the project
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