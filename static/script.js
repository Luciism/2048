const WINNING_TILE = 2048;

const popSoundEffect = new Audio("../static/media/ui-pop-sound.mp3");
const gameOverSoundEffect = new Audio("../static/media/game-over-sound.mp3");
const gameWonSoundEffect = new Audio("../static/media/game-won-sound.mp3");

function animateElementPop(element) {
  element.classList.remove("pop-animated-element");
  void element.offsetWidth;
  element.classList.add("pop-animated-element");
}

const saveNameInputElement = document.getElementById("save-name-input");
const createSaveBtnElement = document.querySelector(".save-controls [control='new-save']");
const gameSavesListElement = document.getElementById("saves-list");

const gameOverOverlayElement = document.querySelector(".game-over-overlay");
const gameWonOverlayElement = document.querySelector(".game-won-overlay");

const randomArrayElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const gameGridElement = document.getElementById("game-grid");

class GameGrid {
  constructor() {
    this.gamePieceCells = Array.from(
      document.querySelectorAll(".game-piece-cell")
    );

    const gameGridRect = gameGridElement.getBoundingClientRect();
    this.relativeCellPositions = this.gamePieceCells.map((cell) => {
      const cellRect = cell.getBoundingClientRect();
      return [cellRect.x - gameGridRect.x, cellRect.y - gameGridRect.y];
    });
  }
}

const gameTilesElement = document.getElementById("game-tiles");

class TileManager {
  constructor(scoreManager, gameFinishHook) {
    this.scoreManager = scoreManager;
    this.gameFinishHook = gameFinishHook;
    this.clearBoard();
  }

  randomUnoccupiedPosition() {
    const availableTiles = this.tileGrid
      .map((tile, i) => i)
      .filter((i) => this.tileGrid[i] === null);

    const position = randomArrayElement(availableTiles) + 1;
    return position;
  }

  addTile(tileNumber, position) {
    // Create Element
    const tileElement = document.createElement("p");
    tileElement.innerText = tileNumber;
    tileElement.className = `game-tile`;
    tileElement.setAttribute("position", position);
    tileElement.setAttribute("num", tileNumber);

    this.tileGrid[position - 1] = tileElement;
    gameTilesElement.appendChild(tileElement);

    return tileElement;
  }

  addRandomTile(tileOptions = [2]) {
    const tileNumber = randomArrayElement(tileOptions);
    const position = this.randomUnoccupiedPosition();
    if (position > 0 && position <= 16) {
      return this.addTile(tileNumber, position);
    }
    return null;  // No available positions
  }

  mergeTiles(tile1, tile2) {
    const oldNum = parseInt(tile1.textContent);
    const newNum = oldNum * 2;

    const tile1Position = parseInt(tile1.getAttribute("position"));
    const tile2Position = parseInt(tile2.getAttribute("position"));

    tile2.setAttribute("num", newNum);
    tile2.textContent = newNum;
    tile2.setAttribute("position", tile1Position);
    tile1.remove();
    animateElementPop(tile2);
    this.tileGrid[tile1Position - 1] = tile2;
    this.tileGrid[tile2Position - 1] = null;

    this.scoreManager.addScore(newNum);
    popSoundEffect.play();

    return newNum;
  }


  shiftTile(tilePosition, shift, minOrMaxPosition, maximize=false) {
    const tileElement = this.tileGrid[tilePosition - 1];

    if (!tileElement) {
      // console.log("No tile element");
      return;
    }

    if (1 > tilePosition + shift > 16) {
      // console.log("Tile position out of range");
      return;
    }

    let nextTile = null;
    let nextTilePosition = tilePosition;
    while (
      !maximize
      ? !nextTile && nextTilePosition + shift >= minOrMaxPosition(tilePosition)
      : !nextTile && nextTilePosition + shift <= minOrMaxPosition(tilePosition)
    ) {
      nextTilePosition += shift;
      nextTile = this.tileGrid[nextTilePosition - 1];
    }

    let position;

    if (nextTile && nextTile !== tileElement) {
      if (nextTile.getAttribute("num") === tileElement.getAttribute("num")) {
        // Merge tile
        position = null;

        const mergeResult = this.mergeTiles(nextTile, tileElement);
        if (mergeResult === WINNING_TILE) {
          this.gameFinishHook();
        }

      } else {
        // Shift tile to max pos
        position = nextTilePosition - shift;
      }
    } else {
      position = minOrMaxPosition(tilePosition);
    }
    if (position !== null) {
      tileElement.setAttribute("position", position);
 
      this.tileGrid[tilePosition - 1] = null;
      this.tileGrid[position - 1] = tileElement;
    }
  }
  shiftTileLeft(tilePosition) {
    this.shiftTile(tilePosition, -1, (pos) => {
      return Math.floor((pos - 1) / 4) * 4 + 1;
    });
  }
  shiftTileRight(tilePosition) {
    this.shiftTile(tilePosition, 1, (pos) => {
      return Math.floor((pos - 1) / 4) * 4 + 4;
    }, true);
  }
  shiftTileDown(tilePosition) {
    this.shiftTile(tilePosition, 4, (pos) => {
      let minTileIndex = (pos % 4 || 4) + 12;

      return minTileIndex;
    }, true);
  }
  shiftTileUp(tilePosition) {
    this.shiftTile(tilePosition, -4, (pos) => {
      let minTileIndex = pos % 4 || 4;

      return minTileIndex;
    });
  }

  shift(shiftTileCallable, backwards=false) {
    const gridBefore = this.flatTileGrid(); 
    if (!backwards) {
      for (let i = 0; i < this.tileGrid.length; i++) {
        shiftTileCallable(i + 1);
      }
    } else {
      for (let i = 16; i >= 0; i--) {
        shiftTileCallable(i + 1);
      }
    }

    const gridAfter = this.flatTileGrid();
    if (JSON.stringify(gridBefore) !== JSON.stringify(gridAfter)) {
      this.addRandomTile();

      if (this.outOfMoves()) {
        this.gameOver();
        localStorage.removeItem("gameState");
      } else {
        // Save game state to local storage
        const gameState = JSON.stringify({
          score: this.scoreManager.currentScore,
          tileGrid: this.flatTileGrid() 
        });
        localStorage.setItem("gameState", gameState);
      }
    }
  }

  gameOver() {
    gameOverSoundEffect.play();
    setTimeout(() => {
      gameOverOverlayElement.classList.add("active");
      gameWonOverlayElement.classList.remove("active");
    }, 1000);
  }

  outOfMoves() {
    // Check if game grid is full
    if (this.tileGrid.filter(tile => tile !== null).length < 16) {
      return false;
    }

    // Check for two consecutive tiles (horizontally)
    for (let i = 0; i < this.tileGrid.length; i++) {
      const tile = this.tileGrid[i];
      const nextTile = this.tileGrid[i+1];

      if (tile && nextTile) {
        const tile1Num = parseInt(tile.getAttribute("num"));
        const tile2Num = parseInt(nextTile.getAttribute("num"));
        const tile1Pos = parseInt(tile.getAttribute("position"));
        const tile2Pos = parseInt(nextTile.getAttribute("position"));

        if (tile1Num === tile2Num) {
          // Ensure same row
          if (Math.floor((tile1Pos - 1) / 4) === Math.floor((tile2Pos - 1) / 4)) {
            return false;
          }
        }
      }
    }

    // Check for two consecutive tiles (vertically)
    for (let i = 0; i < this.tileGrid.length - 4; i++) {
      const tile = this.tileGrid[i];
      const nextTile = this.tileGrid[i + 4];

      if (tile && nextTile) {
        if (tile.getAttribute("num") === nextTile.getAttribute("num")) {
          return false;
        }
      }
    }
    return true;
  }

  clearBoard() {
    gameTilesElement.innerHTML = '';

    this.tileGrid = [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ];
  }

  flatTileGrid() {
    return this.tileGrid.map(tile => {
      if (tile !== null) {
        return tile.getAttribute("num");
      }
      return null;
    })
  }
}

class ScoreManager {
  constructor() {
    this.currentScore = 0;
    this.bestScore = parseInt(localStorage.getItem("bestScore") || 0)

    this.currentScoreElement = document.querySelector(".current-score .value");
    this.bestScoreElement = document.querySelector(".best-score .value");
    this.gameOverOverlayScoreElement = document.querySelector(".game-over-overlay .score .value");
    this.gameWonOverlayScoreElement = document.querySelector(".game-won-overlay .score .value");
  }

  initBestScore() {
    this.bestScoreElement.innerText = this.bestScore.toLocaleString();
  }

  updateScore(score) {
    this.currentScore = score;
    this.currentScoreElement.innerText = score.toLocaleString();
    this.gameOverOverlayScoreElement.innerText = score.toLocaleString();
    this.gameWonOverlayScoreElement.innerText = score.toLocaleString();

    if (score > this.bestScore) {
      this.bestScore = score;
      this.bestScoreElement.innerText = score.toLocaleString();

      localStorage.setItem("bestScore", score)
    }
  }

  refresh() {
    this.updateScore(this.currentScore)
  }

  addScore(value) {
    this.updateScore(this.currentScore + value);
  }
}

new ScoreManager().initBestScore();

class SaveManager {
  constructor(gameManager) {
    this.gameManager = gameManager;
    createSaveBtnElement.onclick = () => this.onCreateSaveBtnClick();
  }

  onCreateSaveBtnClick() {
    let saveName = saveNameInputElement.value;
    if (saveName.length == 0) {
      saveNameInputElement.focus();
      return;
    }

    const gameState = localStorage.getItem("gameState");
    if (gameState) {
      this.createSave(saveName, JSON.parse(gameState));
    }
    saveNameInputElement.value = "";
  }

  loadSavesFromLocalStorage() {
    const saves = localStorage.getItem("gameSaves");
    
    if (saves) {
      try {
        return JSON.parse(saves);
      } catch {
        localStorage.removeItem("gameSaves");
      }
    }
    return [];
  }

  setGameSaves(gameSaves) {
    localStorage.setItem("gameSaves", JSON.stringify(gameSaves));
  }

  createSave(saveName, gameState) {
    const saveData = {
      name: saveName,
      id: new Date().toISOString(),
      gameState: gameState
    };

    const existingSaves = this.loadSavesFromLocalStorage();
    existingSaves.push(saveData);
    this.setGameSaves(existingSaves);

    this.addSaveElement(saveData); 
  }

  deleteSave(saveID) {
    const existingSaves = this.loadSavesFromLocalStorage();
    const newSaves = existingSaves.filter(save => save.id !== saveID);
    this.setGameSaves(newSaves);
  }

  updateSavesList() {
    const existingSaves = this.loadSavesFromLocalStorage();
    gameSavesListElement.innerHTML = "";
    existingSaves.forEach(save => {
      this.addSaveElement(save);
    });

    if (gameSavesListElement.childElementCount === 0) {
      this.addPlaceholderElement();
    }
  }

  addPlaceholderElement() {
    const placeholder = document.createElement("li");
    placeholder.classList = "save-placeholder";
    placeholder.innerText = "No saves have been created";
    gameSavesListElement.appendChild(placeholder);
  }

  addSaveElement(saveData) {
    const saveElement = document.createElement("li");
    saveElement.className = "save";

    saveElement.innerHTML = `
      <span class="save-info">
        <span class="detail-save-name">${saveData.name}</span>
        <span class="detail-save-score">Score: ${saveData.gameState.score.toLocaleString()}</span>
      </span>
      <span class="save-actions" save-id="${saveData.id}">
        <button control="load-save">Load</button>
        <!-- button class="red" control="delete-save">Delete</button -->
      </span>
    `;

    saveElement.querySelector("[control='load-save']").onclick = () => {
      this.gameManager.loadGame(saveData.gameState);
    }

    // saveElement.querySelector("[control='delete-save']").onclick = () => {
    //   this.deleteSave(saveData.id);
    //   saveElement.remove();
    //   if (gameSavesListElement.childElementCount === 0) {
    //     this.addPlaceholderElement()
    //   }
    // }

    gameSavesListElement.appendChild(saveElement);
    const placeholderElement = gameSavesListElement.querySelector(".save-placeholder");
    if (placeholderElement) {
      placeholderElement.remove();
    }
  }
}

class GameManager {
  constructor() {
    this.gameGrid = new GameGrid();
    this.scoreManager = new ScoreManager();

    this.winningTileCount = 0;
    this.tileManager = new TileManager(this.scoreManager, () => this.gameWon());

    this.eventsAreSetup = false;

    const movementHandler = (e, shiftFn) => {
      shiftFn();
      e.preventDefault();
    }

    const shift = {
      u: () => this.tileManager.shift(pos => this.tileManager.shiftTileUp(pos)),
      d: () => this.tileManager.shift(pos => this.tileManager.shiftTileDown(pos), true),
      l: () => this.tileManager.shift(pos => this.tileManager.shiftTileLeft(pos)),
      r: () => this.tileManager.shift(pos => this.tileManager.shiftTileRight(pos), true),
    }

    this.onKeypress = (e) => {
      if (e.key == "ArrowDown")  return movementHandler(e, shift.d);
      if (e.key == "ArrowUp")    return movementHandler(e, shift.u);
      if (e.key == "ArrowLeft")  return movementHandler(e, shift.l);
      if (e.key == "ArrowRight") return movementHandler(e, shift.r);
    };

    this.onSwipe = (e) => {
      const direction = e.detail.primaryDirection;
      if (direction == "up")    return movementHandler(e, shift.u);
      if (direction == "down")  return movementHandler(e, shift.d);
      if (direction == "left")  return movementHandler(e, shift.l);
      if (direction == "right") return movementHandler(e, shift.r)
    }

    this.continueControls = Array.from(document.querySelectorAll("[control='continue']"));
    this.resetControls = Array.from(document.querySelectorAll("[control='reset'"));
    this.onResetControlClick = () => this.resetGame();
    this.onContinueControlClick = () => gameWonOverlayElement.classList.remove("active");
  }

  setupEvents() {
    if (this.eventsAreSetup) {
      return;
    }
    this.eventsAreSetup = true;

    window.addEventListener("keydown", this.onKeypress);
    window.addEventListener("swipe", this.onSwipe);

    this.resetControls.forEach(control => {
      control.addEventListener("click", this.onResetControlClick);
    });

    this.continueControls.forEach(control => {
      control.addEventListener("click", this.onContinueControlClick);
    });
  }

  createGame() {
    this.tileManager.clearBoard();
    this.tileManager.addRandomTile([2, 4]);
    this.tileManager.addRandomTile([2, 4]);
    this.setupEvents();
  }

  resetGame() {
    this.winningTileCount = 0;
    this.scoreManager.updateScore(0);
    this.createGame();
    gameOverOverlayElement.classList.remove("active");
    gameWonOverlayElement.classList.remove("active");
  }

  gameWon() {
    this.winningTileCount += 1;

    if (this.winningTileCount === 1) {
      gameWonSoundEffect.play();
      gameWonOverlayElement.classList.add("active");
    }
  }

  loadGame(gameState) {
    const score = gameState.score;
    const tileGrid = gameState.tileGrid;
    
    this.scoreManager.updateScore(score);
    this.tileManager.clearBoard();

    for (let i = 0; i < tileGrid.length; i++) {
      if (tileGrid[i] !== null) {
        this.tileManager.addTile(tileGrid[i], i + 1);
      }
    }
    gameOverOverlayElement.classList.remove("active");
    gameWonOverlayElement.classList.remove("active");

    this.setupEvents();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const gameManager = new GameManager();

  let gameState = localStorage.getItem("gameState");

  (() => {
    if (gameState) {
      try {
        gameState = JSON.parse(gameState);
        gameManager.loadGame(gameState);
        return;
      } catch {
        localStorage.removeItem("gameState");
      }
    }

    gameManager.createGame();
  })()

  const saveManager = new SaveManager(gameManager);
  saveManager.updateSavesList();
});
