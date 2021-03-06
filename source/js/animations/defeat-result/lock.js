import {animateDuration, defaultAnimationTick, scale, runSerialAnimations} from '../helpers';

const LOCK_ANIMATION_DURATION = 100;

const CROCODILE_ANIMATION_DURATION = 800;
const CROCODILE_ANIMATION_DELAY = 300;

const DROP_INTERVAL = 1500;
const DROPS_MAX_COUNT = 2;
const DROP_SCALING_DURATION = 700;
const DROP_TRANSLATING_DURATION = 400;
const DROP_DISAPPEARING_DURATION = 200;

const ww = window.innerWidth;
const wh = window.innerHeight;
const halfWW = ww / 2;
const halfWH = wh / 2;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @return {Promise<{draw: function, animate: function}>}
 */
const lock = (ctx) => new Promise((resolve, reject) => {
  // Lock

  let lockOpacity = 1;
  const lockSize = {
    width: 172,
    height: 292,
  };
  const lockPosition = {
    x: halfWW - lockSize.width / 2,
    y: halfWH - lockSize.height / 2,
  };
  let lockScale = 0.8;

  const lockScaleAnimationTick = (from, to) => (progress) => {
    lockScale = defaultAnimationTick(from, to, progress);
  };

  const lockOpacityAnimationTick = (from, to) => (progress) => {
    lockOpacity = defaultAnimationTick(from, to, progress);
  };

  const getLockCoords = () => {
    const top = lockPosition.y;
    const left = lockPosition.x;
    const bottom = lockPosition.y + lockSize.height;
    const right = lockPosition.x + lockSize.width;

    const rightMiddleBend = {
      x: right - 30,
      y: bottom - 146,
    };
    const leftMiddleBend = {
      x: left + 30,
      y: bottom - 146,
    };

    const middleTop = {
      x: left + lockSize.width / 2,
      y: top,
    };

    const cp1 = {
      x: rightMiddleBend.x + 40,
      y: rightMiddleBend.y - 26,
    };
    const cp2 = {
      x: middleTop.x + 100,
      y: middleTop.y + 5,
    };
    const cp3 = {
      x: middleTop.x - 100,
      y: middleTop.y + 5,
    };
    const cp4 = {
      x: leftMiddleBend.x - 40,
      y: leftMiddleBend.y - 26,
    };

    return {
      top,
      left,
      bottom,
      right,
      rightMiddleBend,
      leftMiddleBend,
      middleTop,
      cp1,
      cp2,
      cp3,
      cp4,
    };
  };

  // Crocodile

  let showCrocodile = false;
  const crocodileSize = {
    width: 585,
    height: 180,
  };
  const crocodilePosition = {
    x: 0,
    y: 0,
  };

  /**
   * @param {{x: number, y: number}} from
   * @param {{x: number, y: number}} to
   * @return {function(...[*]=)}
   */
  const crocodileTranslateAnimationTick = (from, to) => (progress) => {
    crocodilePosition.x = defaultAnimationTick(from.x, to.x, progress);
    crocodilePosition.y = defaultAnimationTick(from.y, to.y, progress);
  };

  // Drop

  const dropSize = {
    width: 40,
    height: 60,
  };
  let dropScale = 0;
  let dropOpacity = 1;
  let dropY = 0;

  const getDropPosition = () => ({
    x: crocodilePosition.x + 240,
    y: crocodilePosition.y + dropY + 60,
  });

  const dropScaleAnimationTick = (from, to) => (progress) => {
    dropScale = defaultAnimationTick(from, to, progress);
  };

  const dropOpacityAnimationTick = (from, to) => (progress) => {
    dropOpacity = defaultAnimationTick(from, to, progress);
  };

  const dropTranslateYAnimationTick = (from, to) => (progress) => {
    dropY = defaultAnimationTick(from, to, progress);
  };

  const crocodileImage = new Image();

  const drawDrop = () => {
    ctx.save();

    scale(
        ctx,
        dropScale,
        dropScale,
        dropSize.width * dropScale - dropSize.width,
        dropSize.height * (1 - dropScale) * 0.8,
    );

    const dropPosition = getDropPosition();
    const leftBend = {
      x: dropPosition.x - 15,
      y: dropPosition.y + 30,
    };
    const rightBend = {
      x: dropPosition.x + 15,
      y: dropPosition.y + 30,
    };
    const bottom = dropPosition.y + dropSize.height;
    const cp1 = {
      x: leftBend.x - 10,
      y: leftBend.y + 12,
    };
    const cp2 = {
      x: dropPosition.x - 15,
      y: bottom,
    };
    const cp3 = {
      x: dropPosition.x + 15,
      y: bottom,
    };
    const cp4 = {
      x: rightBend.x + 10,
      y: rightBend.y + 12,
    };

    ctx.beginPath();
    ctx.moveTo(dropPosition.x, dropPosition.y);
    ctx.lineTo(leftBend.x, leftBend.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, dropPosition.x, bottom);
    ctx.bezierCurveTo(cp3.x, cp3.y, cp4.x, cp4.y, rightBend.x, rightBend.y);
    ctx.closePath();

    ctx.fillStyle = `rgb(180, 195, 255)`;
    ctx.globalAlpha = dropOpacity;
    ctx.fill();

    ctx.restore();
  };

  const drawCrocodile = () => {
    if (!showCrocodile) {
      return;
    }
    ctx.drawImage(crocodileImage, crocodilePosition.x, crocodilePosition.y, crocodileSize.width, crocodileSize.height);
    drawDrop();
  };

  const drawClippedLockPart = () => {
    const {bottom, right, rightMiddleBend, cp1, cp2, middleTop, top} = getLockCoords();

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(right, bottom);
    ctx.lineTo(rightMiddleBend.x, rightMiddleBend.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, middleTop.x, middleTop.y);
    ctx.lineTo(0, top);
    ctx.lineTo(0, wh);
    ctx.lineTo(right, wh);
    ctx.closePath();

    ctx.clip();
    drawCrocodile();

    ctx.restore();
  };

  const drawLock = () => {
    ctx.save();

    scale(ctx, lockScale, lockScale);

    ctx.beginPath();
    const {bottom, right, left, rightMiddleBend, leftMiddleBend, cp1, cp2, cp3, cp4, middleTop} = getLockCoords();
    ctx.moveTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.lineTo(rightMiddleBend.x, rightMiddleBend.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, middleTop.x, middleTop.y);
    ctx.bezierCurveTo(cp3.x, cp3.y, cp4.x, cp4.y, leftMiddleBend.x, leftMiddleBend.y);

    ctx.globalAlpha = lockOpacity;
    ctx.fillStyle = `rgb(167, 126, 229)`;
    ctx.fill();

    ctx.restore();
  };

  const draw = () => {
    drawLock();
    drawClippedLockPart();
  };

  const animateLock = () => {
    animateDuration(lockScaleAnimationTick(0.8, 1), LOCK_ANIMATION_DURATION);
    animateDuration(lockOpacityAnimationTick(0, 1), LOCK_ANIMATION_DURATION);
  };

  const animateDrop = () => {
    setTimeout(() => {
      let dropsCount = 0;
      let interval;

      const animate = () => {
        dropOpacity = 1;
        dropY = 0;
        dropScale = 0;
        runSerialAnimations([
          () => animateDuration(dropScaleAnimationTick(0, 1), DROP_SCALING_DURATION),
          () => animateDuration(dropTranslateYAnimationTick(0, 50), DROP_TRANSLATING_DURATION),
          () => animateDuration(dropOpacityAnimationTick(1, 0), DROP_DISAPPEARING_DURATION),
        ]);

        dropsCount++;
        if (dropsCount >= DROPS_MAX_COUNT) {
          clearInterval(interval);
        }
      };
      interval = setInterval(animate, DROP_INTERVAL);
      animate();
    }, CROCODILE_ANIMATION_DURATION);
  };

  const animateCrocodile = () => {
    setTimeout(() => {
      showCrocodile = true;
      animateDuration(crocodileTranslateAnimationTick({
        x: halfWW + 100,
        y: halfWH - 200,
      }, {
        x: halfWW - 280,
        y: halfWH - 10,
      }), CROCODILE_ANIMATION_DURATION);
      animateDrop();
    }, CROCODILE_ANIMATION_DELAY);
  };

  const animate = () => {
    animateLock();
    animateCrocodile();
  };

  crocodileImage.onload = () => {
    resolve({
      animate,
      draw,
    });
  };

  crocodileImage.onerror = reject;

  crocodileImage.src = `img/lose-images/crocodile.png`;
});

export default lock;
