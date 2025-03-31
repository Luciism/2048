let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
    

function checkDirection() {
    let directionX;
    let directionY;

    if (touchEndX < touchStartX) directionX = "left";
    if (touchEndX > touchStartX) directionX = "right";

    if (touchEndY < touchStartY) directionY = "up";
    if (touchEndY > touchStartY) directionY = "down";

    let differenceX = Math.abs(touchStartX - touchEndX);
    let differenceY = Math.abs(touchStartY - touchEndY);

    let primaryAxis, primaryDirection;

    if (differenceX > differenceY) [primaryAxis, primaryDirection] = ["x", directionX];
    if (differenceY > differenceX) [primaryAxis, primaryDirection] = ["y", directionY];

    const event = new CustomEvent("swipe", {
        detail: { directionX, directionY, primaryAxis, primaryDirection } });

    console.log(event);
    window.dispatchEvent(event);
}

document.addEventListener('touchstart', e => {
  // e.preventDefault();
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', e => {
  // e.preventDefault();
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  checkDirection();
});
