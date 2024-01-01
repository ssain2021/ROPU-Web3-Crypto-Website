import {deleteCookie,
getCookies,
deleteAllCookies,
beforeUnload,
getElement} from '../commonCodesJS.js';

document.addEventListener("DOMContentLoaded", () => {
  
  const config = {
    cursorTrail: false,
    santaFly: true,
    starAnimationDuration: 1500,
    minimumTimeBetweenStars: 250,
    minimumDistanceBetweenStars: 75,
    glowDuration: 100,
    maximumGlowPointSpacing: 5,
    colors: ["#ffae00", "#00bfff", "#fbff00"],
    sizes: ["1.6rem", "1.4rem", "1.2rem"],
    animations: ["fall-1", "fall-2", "fall-3"],
    santaAnimationTimeDiff: 11000, //6 Second
    santaAnimationTime: 10000
  }
    
  function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
  }

  function animateSanta() {
    if (config.santaFly) {
      const santa = document.getElementById('santa');
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      const startFromRight = Math.random() >= 0.5; 
      const startPos = startFromRight ? screenWidth + 200 : -200; // Adjust if Santa starts from the right 
      const endPos = startPos === -200 ? screenWidth + 200 : -200; // Destination is the opposite side 
      let transformStart = `translate(${startPos}px, ${getRandomNumber(-50, screenHeight - 50)}px)`;
      let transformEnd = `translate(${endPos}px, ${getRandomNumber(-50, screenHeight - 50)}px)`;
      if (startFromRight) {
        transformStart += ' scaleX(-1)';
        transformEnd += ' scaleX(-1)';
      }

      let keyframe = `
        @keyframes flyAcross {
          0% { transform: ${transformStart}; }
          100% { transform: ${transformEnd};}
        }
      `;

      // Store a reference to the stylesheet specified by title "privateCSS"
      const privateStyleSheet = Array.from(document.styleSheets)
        .find(sheet => sheet.title === "privateCSS");

      // Add new keyframe animation rule to the private stylesheet
      const newRuleIndex = privateStyleSheet.insertRule(keyframe, privateStyleSheet.cssRules.length);
      santa.style.animation = `flyAcross ${config.santaAnimationTime}ms linear forwards`;

      // Set a timeout to clean up animation rules after the animation ends to avoid flickering
      setTimeout(() => {
        santa.style.animation = ''; // Reset animation
        // Safely delete the rule if the stylesheet length is greater than the stored index
        if (newRuleIndex < privateStyleSheet.cssRules.length) {
          privateStyleSheet.deleteRule(newRuleIndex);
        } 
      }, config.santaAnimationTime); // Timeout matches the animation duration
    }
  }

  // Initial call to start the animation loop
  animateSanta();

  // Then set it to repeat animation based on the configured time diff
  setInterval(animateSanta, config.santaAnimationTimeDiff + config.santaAnimationTime);
  
  let start = new Date().getTime();

  const originPosition = { x: 0, y: 0 };

  const last = {
    starTimestamp: start,
    starPosition: originPosition,
    mousePosition: originPosition
  }

  let count = 0;

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        selectRandom = items => items[rand(0, items.length - 1)];

  const withUnit = (value, unit) => `${value}${unit}`,
        px = value => withUnit(value, "px"),
        ms = value => withUnit(value, "ms");

  const calcDistance = (a, b) => {
    const diffX = b.x - a.x,
          diffY = b.y - a.y;

    return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
  }

  const calcElapsedTime = (start, end) => end - start;

  const appendElement = element => document.body.appendChild(element),
        removeElement = (element, delay) => setTimeout(() => document.body.removeChild(element), delay);

  const createStar = position => {
    const star = document.createElement("span"),
          color = selectRandom(config.colors);

    star.className = "fa-solid fa-gift gift";

    star.style.left = px(position.x);
    star.style.top = px(position.y);
    star.style.fontSize = selectRandom(config.sizes);
    star.style.color = `${color}`;
    star.style.textShadow = `0px 0px 1.5rem rgb(${color} / 0.5)`;
    star.style.animationName = config.animations[count++ % 3];
    star.style.starAnimationDuration = ms(config.starAnimationDuration);
    star.style.position = "absolute";

    appendElement(star);

    removeElement(star, config.starAnimationDuration);
  }

  const createGlowPoint = position => {
    const glow = document.createElement("div");

    glow.className = "glow-point";

    glow.style.left = px(position.x);
    glow.style.top = px(position.y);
    glow.style.position = "absolute";

    appendElement(glow)

    removeElement(glow, config.glowDuration);
  }

  const determinePointQuantity = distance => Math.max(
    Math.floor(distance / config.maximumGlowPointSpacing),
    1
  );

    const createGlow = (last, current) => {
    const distance = calcDistance(last, current),
          quantity = determinePointQuantity(distance);

    const dx = (current.x - last.x) / quantity,
          dy = (current.y - last.y) / quantity;

    Array.from(Array(quantity)).forEach((_, index) => { 
      const x = last.x + dx * index, 
            y = last.y + dy * index;

      createGlowPoint({ x, y });
    });
  }

  const updateLastStar = position => {
    last.starTimestamp = new Date().getTime();

    last.starPosition = position;
  }

  const updateLastMousePosition = position => last.mousePosition = position;

  const adjustLastMousePosition = position => {
    if(last.mousePosition.x === 0 && last.mousePosition.y === 0) {
      last.mousePosition = position;
    }
  };

  const handleOnMove = e => {
    const mousePosition = { x: e.pageX, y: e.pageY }

    adjustLastMousePosition(mousePosition);

    const now = new Date().getTime(),
          hasMovedFarEnough = calcDistance(last.starPosition, mousePosition) >= config.minimumDistanceBetweenStars,
          hasBeenLongEnough = calcElapsedTime(last.starTimestamp, now) > config.minimumTimeBetweenStars;

    if(hasMovedFarEnough || hasBeenLongEnough) {
      createStar(mousePosition);

      updateLastStar(mousePosition);
    }

    createGlow(last.mousePosition, mousePosition);

    updateLastMousePosition(mousePosition);
  }

  if(config.cursorTrail || !isMobile) { window.onmousemove = e => handleOnMove(e); }

  if(config.cursorTrail || !isMobile) { window.ontouchmove = e => handleOnMove(e.touches[0]); }

  document.body.onmouseleave = () => updateLastMousePosition(originPosition);

});

