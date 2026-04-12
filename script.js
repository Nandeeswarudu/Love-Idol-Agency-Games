const floatingField = document.getElementById("floatingField");

if (floatingField) {
  const symbols = [
    "(^_^)",
    "(>_<)",
    "(o_o)",
    "(UwU)",
    "(^o^)/",
    "\u2606",
    "\u2605",
    "\u2726",
    "\u2727",
    "\u2729",
    "\u{1F339}",
    "\u2740",
    "\u273F",
    "\u{1F52B}",
    "\u2660",
    "\u2663",
    "\u2666",
    "\u2665",
    "\u2699",
    "\u263D",
    "\u263C",
  ];

  const particleCount = 36;
  const particles = [];
  let viewportWidth = window.innerWidth;
  let viewportHeight = window.innerHeight;
  let lastTime = performance.now();

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnParticle(index) {
    const element = document.createElement("span");
    element.className = `floating-symbol${index % 2 === 0 ? " alt" : ""}`;
    element.textContent = symbols[Math.floor(Math.random() * symbols.length)];

    const fontSizeRem = randomBetween(0.85, 1.7);
    const fontSizePx = fontSizeRem * 16;
    const radius = fontSizePx * 0.55;
    const speed = randomBetween(22, 58);
    const angle = randomBetween(0, Math.PI * 2);

    element.style.fontSize = `${fontSizeRem.toFixed(2)}rem`;
    floatingField.appendChild(element);

    return {
      element,
      radius,
      mass: radius * radius,
      x: randomBetween(radius, Math.max(radius + 1, viewportWidth - radius)),
      y: randomBetween(radius, Math.max(radius + 1, viewportHeight - radius)),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: randomBetween(-22, 22),
      rotation: randomBetween(0, 360),
    };
  }

  function keepInBounds(p) {
    if (p.x - p.radius < 0) {
      p.x = p.radius;
      p.vx = Math.abs(p.vx);
    } else if (p.x + p.radius > viewportWidth) {
      p.x = viewportWidth - p.radius;
      p.vx = -Math.abs(p.vx);
    }

    if (p.y - p.radius < 0) {
      p.y = p.radius;
      p.vy = Math.abs(p.vy);
    } else if (p.y + p.radius > viewportHeight) {
      p.y = viewportHeight - p.radius;
      p.vy = -Math.abs(p.vy);
    }
  }

  function resolveCollision(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distSq = dx * dx + dy * dy;
    if (distSq === 0) {
      return;
    }

    const distance = Math.sqrt(distSq);
    const minDist = a.radius + b.radius;
    if (distance >= minDist) {
      return;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    const overlap = minDist - distance;

    const aMove = (overlap * (b.mass / (a.mass + b.mass))) * 1.01;
    const bMove = (overlap * (a.mass / (a.mass + b.mass))) * 1.01;
    a.x -= nx * aMove;
    a.y -= ny * aMove;
    b.x += nx * bMove;
    b.y += ny * bMove;

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const velocityAlongNormal = rvx * nx + rvy * ny;
    if (velocityAlongNormal > 0) {
      return;
    }

    const restitution = 0.96;
    const impulse =
      (-(1 + restitution) * velocityAlongNormal) /
      ((1 / a.mass) + (1 / b.mass));

    const impulseX = impulse * nx;
    const impulseY = impulse * ny;

    a.vx -= impulseX / a.mass;
    a.vy -= impulseY / a.mass;
    b.vx += impulseX / b.mass;
    b.vy += impulseY / b.mass;
  }

  function update(dt) {
    const friction = 0.999;
    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= friction;
      p.vy *= friction;
      p.rotation += p.spin * dt;
      keepInBounds(p);
    }

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        resolveCollision(particles[i], particles[j]);
      }
    }

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.element.style.transform =
        `translate3d(${(p.x - p.radius).toFixed(1)}px, ${(p.y - p.radius).toFixed(1)}px, 0) rotate(${p.rotation.toFixed(1)}deg)`;
    }
  }

  function tick(now) {
    const dt = Math.min(0.035, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    requestAnimationFrame(tick);
  }

  function onResize() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    for (let i = 0; i < particles.length; i += 1) {
      keepInBounds(particles[i]);
    }
  }

  for (let i = 0; i < particleCount; i += 1) {
    particles.push(spawnParticle(i));
  }

  window.addEventListener("resize", onResize);
  requestAnimationFrame((time) => {
    lastTime = time;
    tick(time);
  });
}
