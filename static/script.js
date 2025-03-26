function animateElementPop(element) {
  element.classList.remove("pop-animated-element");
  void element.offsetWidth;
  element.classList.add("pop-animated-element");
}


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
  constructor() {
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
      console.log(`adding tile at position ${position}`);
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
  }


  shiftTile(tilePosition, shift, minOrMaxPosition, maximize=false) {
    const tileElement = this.tileGrid[tilePosition - 1];

    if (!tileElement) {
      console.log("No tile element");
      return;
    }

    if (1 > tilePosition + shift > 16) {
      console.log("Tile position out of range");
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
        this.mergeTiles(nextTile, tileElement);
      } else {
        // Shift tile to max pos
        console.log(`Shifting tile ${tilePosition} to ${nextTilePosition - shift}`);
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
    }
  }
  shiftUp() {
    const gridBefore = this.flatTileGrid(); 
    for (let i = 0; i < this.tileGrid.length; i++) {
      this.shiftTileUp(i + 1);
    }

    const gridAfter = this.flatTileGrid();
    if (JSON.stringify(gridBefore) !== JSON.stringify(gridAfter)) {
      this.addRandomTile();
    }
  }

  clearBoard() {
    gameTilesElement.childNodes.forEach((child) => {
      gameTilesElement.removeChild(child);
    });

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

class GameManager {
  constructor() {
    this.gameGrid = new GameGrid();
    this.tileManager = new TileManager();

    this.onKeypress = (e) => {
      if (e.key == "ArrowUp") {
        console.log("up");
        this.tileManager.shift(pos => this.tileManager.shiftTileUp(pos));
        return;
      }
      if (e.key == "ArrowLeft") {
        this.tileManager.shift(pos => this.tileManager.shiftTileLeft(pos));
        return;
      }
      if (e.key == "ArrowDown") {
        this.tileManager.shift(pos => this.tileManager.shiftTileDown(pos), true);
        return;
      }
      if (e.key == "ArrowRight") {
        this.tileManager.shift(pos => this.tileManager.shiftTileRight(pos), true);
        return;
      }
    };
  }

  createGame() {
    this.tileManager.addRandomTile([2, 4]);
    this.tileManager.addRandomTile([2, 4]);
    window.addEventListener("keydown", this.onKeypress);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const gameManager = new GameManager();
  gameManager.createGame();
});
