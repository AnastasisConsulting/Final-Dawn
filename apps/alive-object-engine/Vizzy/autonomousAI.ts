interface AutonomousBehavior {
  wanderTarget: { x: number; y: number };
  mousePos: { x: number; y: number };
  emotionalState: 'calm' | 'curious' | 'excited' | 'following' | 'pouncing' | 'nuzzling' | 'nap';
  lastInteraction: number;
  jumpTimer: number;
  pounceTimer: number;
  laserActive?: boolean;
  laserTarget?: { x: number; y: number };
}

/**
 * Vizzy Autonomous AI
 * Makes Vizzy feel alive by acting like a loyal cyber-pet (puppy/cat hybrid)
 * Tracks the player's cursor, "nuzzles" panels, and pounces playfully
 */
export class VizzyAutonomousAI {
  private behavior: AutonomousBehavior = {
    wanderTarget: { x: 0, y: 0 },
    mousePos: { x: 0, y: 0 },
    emotionalState: 'calm',
    lastInteraction: Date.now(),
    jumpTimer: 0,
    pounceTimer: 0
  };

  private wanderState = {
    phase: 'wait' as 'turn' | 'swim' | 'glide' | 'wait',
    timer: 0,
    target: { x: 0, y: 0 },
    currentVelocity: { x: 0, y: 0 },
    currentRotation: 0,
    targetRotation: 0
  };

  constructor() {
    window.addEventListener('mousemove', (e) => {
      // Normalize to -1 to 1 range (Screen Space)
      this.behavior.mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.behavior.mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    // Pick initial random spot to start wandering
    this.pickWanderTarget();
  }

  update(deltaTime: number, userActive: boolean): { x: number; y: number; rotation: number; jump: number } {
    const now = Date.now();
    const timeSinceInteraction = now - this.behavior.lastInteraction;

    // 0. HEIST OVERRIDE
    const heistMove = this.updateHeist(deltaTime);
    if (heistMove) return heistMove;

    // Update emotional state based on activity
    if (userActive) {
      this.behavior.lastInteraction = now;
      if (this.behavior.emotionalState === 'nap') this.behavior.emotionalState = 'curious';

      const distToMouse = Math.sqrt(
        (this.behavior.mousePos.x - this.behavior.wanderTarget.x) ** 2 +
        (this.behavior.mousePos.y - this.behavior.wanderTarget.y) ** 2
      );

      if (distToMouse < 0.3 && Math.random() < 0.05) {
        // Only nuzzle if VERY close
        this.behavior.emotionalState = 'nuzzling';
      } else if (distToMouse < 0.4 && Math.random() < 0.02) {
        // Occasional playful pounce if close
        this.behavior.emotionalState = 'pouncing';
      }
      // REMOVED 'following' trigger on distance > 0.8
      // He should only follow if TOLD to (via chat command 'come here') or laser mode.
    } else if (timeSinceInteraction > 45000) {
    } else if (timeSinceInteraction > 45000) {
      this.behavior.emotionalState = 'nap';
    } else {
      // If idle for a bit, start wandering
      if (this.behavior.emotionalState !== 'curious') {
        this.behavior.emotionalState = 'curious'; // Default to curious wandering
      }
    }

    // Handle jumping/pouncing logic
    let jump = 0;
    if (this.behavior.emotionalState === 'excited' || this.behavior.emotionalState === 'pouncing') {
      this.behavior.jumpTimer += deltaTime;
      const freq = this.behavior.emotionalState === 'pouncing' ? 0.6 : 0.4;
      if (this.behavior.jumpTimer > freq) {
        this.behavior.jumpTimer = 0;
        if (this.behavior.emotionalState === 'pouncing') this.behavior.emotionalState = 'curious';
      }
      jump = Math.sin((this.behavior.jumpTimer / freq) * Math.PI) * (this.behavior.emotionalState === 'pouncing' ? 1.2 : 0.5);
    }

    // Choose behavior
    let movement;
    switch (this.behavior.emotionalState) {
      case 'following':
        movement = this.followCursor(deltaTime);
        break;
      case 'pouncing':
        movement = this.pounce(deltaTime);
        break;
      case 'nuzzling':
        movement = this.nuzzle(deltaTime);
        break;
      case 'excited':
        movement = this.wag(deltaTime);
        break;
      case 'nap':
        movement = this.breathe(deltaTime);
        break;
      case 'curious':
      default:
        movement = this.wander(deltaTime); // Replaced idle with wander
    }

    // LASER POINTER OVERRIDE: ADVANCED FELINE PHYSICS
    if (this.behavior.laserActive && this.behavior.laserTarget) {
      // 1. Calculate Laser Velocity
      const dx = this.behavior.laserTarget.x - this.behavior.mousePos.x;
      const dy = this.behavior.laserTarget.y - this.behavior.mousePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Update internal mousePos tracking
      this.behavior.mousePos.x = this.behavior.laserTarget.x;
      this.behavior.mousePos.y = this.behavior.laserTarget.y;

      const laserSpeed = dist / deltaTime; // Units per second approx

      // 2. Logic State Machine
      let behaviorMod = { x: 0, y: 0, r: 0, j: 0 };
      const now = Date.now();

      // STATE 1: FREEZE (Laser is still)
      if (laserSpeed < 0.1 && dist < 0.05) {
        this.behavior.emotionalState = 'curious'; // Alert but still
        // Tension vibration (very subtle)
        behaviorMod.r = Math.sin(now * 0.05) * 0.02;

        // Move towards it slowly if far, else freeze
        const distToVizzy = Math.sqrt((this.behavior.wanderTarget.x - this.behavior.laserTarget.x) ** 2 + (this.behavior.wanderTarget.y - this.behavior.laserTarget.y) ** 2);
        if (distToVizzy > 0.5) {
          // Creep closer
          this.behavior.wanderTarget.x += (this.behavior.laserTarget.x - this.behavior.wanderTarget.x) * 0.5 * deltaTime;
          this.behavior.wanderTarget.y += (this.behavior.laserTarget.y - this.behavior.laserTarget.y) * 0.5 * deltaTime;
        }
      }
      // STATE 2: THE WIGGLE (Small movements, "Getting Ready")
      else if (dist < 0.3) {
        this.behavior.emotionalState = 'excited'; // Butt wiggle energy
        // Wiggle side to side relative to target vector
        const angle = Math.atan2(dy, dx);
        const wiggle = Math.sin(now * 0.02) * 0.1;
        behaviorMod.x += Math.cos(angle + Math.PI / 2) * wiggle;
        behaviorMod.y += Math.sin(angle + Math.PI / 2) * wiggle;
        behaviorMod.r = wiggle * 0.5;
      }
      // STATE 3: STALK / MIRROR (Medium Speed)
      else if (laserSpeed < 2.0) {
        this.behavior.emotionalState = 'following';
        // Mirror movement but slightly smaller radius (timing the stroke)
        const targetX = this.behavior.laserTarget.x - (dx * 0.2); // Lag behind slightly
        const targetY = this.behavior.laserTarget.y - (dy * 0.2);

        this.behavior.wanderTarget.x += (targetX - this.behavior.wanderTarget.x) * 2.0 * deltaTime;
        this.behavior.wanderTarget.y += (targetY - this.behavior.wanderTarget.y) * 2.0 * deltaTime;
      }
      // STATE 4: POUNCE (Fast Movement)
      else {
        this.behavior.emotionalState = 'pouncing';
        // Leap!
        behaviorMod.j = 0.5; // Jump height
        // Fast lerp to intercept
        this.behavior.wanderTarget.x += (this.behavior.laserTarget.x - this.behavior.wanderTarget.x) * 5.0 * deltaTime;
        this.behavior.wanderTarget.y += (this.behavior.laserTarget.y - this.behavior.wanderTarget.y) * 5.0 * deltaTime;
        behaviorMod.r = Math.atan2(dy, dx); // Face direction of leap
      }

      this.behavior.lastInteraction = now;

      return {
        x: this.behavior.wanderTarget.x + behaviorMod.x,
        y: this.behavior.wanderTarget.y + behaviorMod.y,
        rotation: behaviorMod.r,
        jump: behaviorMod.j
      };
    }

    return { ...movement, jump };
  }

  setLaserTarget(active: boolean, x: number, y: number) {
    this.behavior.laserActive = active;
    if (active) {
      this.behavior.laserTarget = { x, y };
      this.behavior.emotionalState = 'pouncing';
    } else {
      this.behavior.emotionalState = 'curious';
    }
  }

  private pickWanderTarget() {
    // UNLEASHED: Full screen wandering
    // Range: -1.8 (Left) to 1.8 (Right)
    const targetX = (Math.random() * 3.6) - 1.8;

    // Vertical Range: -0.8 (Bottom) to 0.8 (Top)
    const targetY = (Math.random() * 1.6) - 0.8;

    this.wanderState.target = {
      x: targetX,
      y: targetY
    };

    // Calculate rotation to target
    const dx = this.wanderState.target.x - this.behavior.wanderTarget.x;
    const dy = this.wanderState.target.y - this.behavior.wanderTarget.y;
    this.wanderState.targetRotation = Math.atan2(dy, dx);

    // Start Sequence
    this.wanderState.phase = 'turn';
    this.wanderState.timer = 0.5 + Math.random() * 0.5; // Turn time
  }

  private wander(deltaTime: number): { x: number; y: number; rotation: number } {
    this.wanderState.timer -= deltaTime;
    let roll = 0; // Banking effect

    switch (this.wanderState.phase) {
      case 'turn':
        // Interpolate rotation to face target
        let angleDiff = this.wanderState.targetRotation - this.wanderState.currentRotation;
        // Normalize angle diff to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Smooth turn
        this.wanderState.currentRotation += angleDiff * (deltaTime * 3.0);

        // Slight bank into turn
        roll = angleDiff * 0.5;

        if (Math.abs(angleDiff) < 0.1 || this.wanderState.timer <= 0) {
          this.wanderState.phase = 'swim';
          this.wanderState.timer = 0.5 + Math.random() * 0.5; // Swim burst duration

          // Set initial velocity vector based on rotation
          const burstSpeed = 1.5;
          this.wanderState.currentVelocity.x = Math.cos(this.wanderState.currentRotation) * burstSpeed;
          this.wanderState.currentVelocity.y = Math.sin(this.wanderState.currentRotation) * burstSpeed;
        }
        break;

      case 'swim':
        // High speed movement
        this.behavior.wanderTarget.x += this.wanderState.currentVelocity.x * deltaTime;
        this.behavior.wanderTarget.y += this.wanderState.currentVelocity.y * deltaTime;

        // Undulate (Tail wag effect)
        roll = Math.sin(Date.now() * 0.015) * 0.2;

        if (this.wanderState.timer <= 0) {
          this.wanderState.phase = 'glide';
          this.wanderState.timer = 1.0 + Math.random() * 1.5; // Glide duration
        }
        break;

      case 'glide':
        // Decaying velocity
        // Simple friction approximation
        this.wanderState.currentVelocity.x *= 0.92;
        this.wanderState.currentVelocity.y *= 0.92;

        this.behavior.wanderTarget.x += this.wanderState.currentVelocity.x * deltaTime;
        this.behavior.wanderTarget.y += this.wanderState.currentVelocity.y * deltaTime;

        if (this.wanderState.timer <= 0) {
          this.wanderState.phase = 'wait';
          this.wanderState.timer = 0.5 + Math.random() * 2.0; // Wait duration
        }
        break;

      case 'wait':
        // Hover/Drift
        const t = Date.now() * 0.001;
        this.behavior.wanderTarget.x += Math.cos(t) * 0.05 * deltaTime;
        this.behavior.wanderTarget.y += Math.sin(t * 0.7) * 0.05 * deltaTime;

        if (this.wanderState.timer <= 0) {
          this.pickWanderTarget();
        }
        break;
    }

    return {
      x: this.behavior.wanderTarget.x,
      y: this.behavior.wanderTarget.y,
      rotation: this.wanderState.currentRotation + roll // Combine facing + blink/bank
    };
  }

  private followCursor(deltaTime: number): { x: number; y: number; rotation: number } {
    // Smoothed target following
    this.behavior.wanderTarget.x += (this.behavior.mousePos.x - this.behavior.wanderTarget.x) * 0.05;
    this.behavior.wanderTarget.y += (this.behavior.mousePos.y - this.behavior.wanderTarget.y) * 0.05;

    const angle = Math.atan2(
      this.behavior.mousePos.y - this.behavior.wanderTarget.y,
      this.behavior.mousePos.x - this.behavior.wanderTarget.x
    );

    return {
      x: this.behavior.wanderTarget.x,
      y: this.behavior.wanderTarget.y,
      rotation: angle * 0.5,
    };
  }

  private pounce(deltaTime: number): { x: number; y: number; rotation: number } {
    // Sharp move towards target
    const speed = 0.15;
    this.behavior.wanderTarget.x += (this.behavior.mousePos.x - this.behavior.wanderTarget.x) * speed;
    this.behavior.wanderTarget.y += (this.behavior.mousePos.y - this.behavior.wanderTarget.y) * speed;

    return {
      x: this.behavior.wanderTarget.x,
      y: this.behavior.wanderTarget.y,
      rotation: Math.sin(Date.now() * 0.02) * 0.5,
    };
  }

  private nuzzle(deltaTime: number): { x: number; y: number; rotation: number } {
    const t = Date.now() * 0.003;
    return {
      x: this.behavior.mousePos.x + Math.sin(t) * 0.1,
      y: this.behavior.mousePos.y + Math.cos(t) * 0.1,
      rotation: Math.sin(t * 2) * 0.2,
    };
  }

  private wag(deltaTime: number): { x: number; y: number; rotation: number } {
    const t = Date.now() * 0.01;
    return {
      x: this.behavior.wanderTarget.x + Math.sin(t) * 0.05,
      y: this.behavior.wanderTarget.y + Math.cos(t * 1.5) * 0.05,
      rotation: Math.sin(t * 3) * 0.6,
    };
  }

  private breathe(deltaTime: number): { x: number; y: number; rotation: number } {
    const t = Date.now() * 0.001;
    return {
      x: this.behavior.wanderTarget.x,
      y: this.behavior.wanderTarget.y - 0.2, // Sink down slightly
      rotation: Math.sin(t) * 0.05,
    };
  }

  // HEIST STATE
  private heist = {
    active: false,
    phase: 'none' as 'none' | 'stakeout' | 'paranoia' | 'approach' | 'suck' | 'flee' | 'returning_peek' | 'returning_enter',
    targetPanel: '',
    targetPos: { x: 0, y: 0 },
    timer: 0,
    startPos: { x: 0, y: 0 }
  };

  startHeist(panelId: string, x: number, y: number) {
    this.heist.active = true;
    this.heist.phase = 'stakeout';
    this.heist.targetPanel = panelId;
    this.heist.targetPos = { x, y };
    this.heist.timer = 0;
    this.behavior.emotionalState = 'curious';
    console.log(`[VizzyAI] Starting Heist on ${panelId}`);
  }

  private updateHeist(deltaTime: number): { x: number; y: number; rotation: number; jump: number } | null {
    if (!this.heist.active) return null;

    this.heist.timer += deltaTime;
    const t = this.heist.timer;

    switch (this.heist.phase) {
      case 'stakeout':
        // Go to a vantage point near target but not ON it
        // e.g. somewhat below or to the side
        const vantageX = this.heist.targetPos.x * 1.2;
        const vantageY = this.heist.targetPos.y - 0.5;

        const dx = vantageX - this.behavior.wanderTarget.x;
        const dy = vantageY - this.behavior.wanderTarget.y;

        // Move there
        this.behavior.wanderTarget.x += dx * 2.0 * deltaTime;
        this.behavior.wanderTarget.y += dy * 2.0 * deltaTime;

        if (t > 4.0) {
          this.heist.phase = 'paranoia';
          this.heist.timer = 0;
        }
        return { x: this.behavior.wanderTarget.x, y: this.behavior.wanderTarget.y, rotation: Math.atan2(dy, dx), jump: 0 };

      case 'paranoia':
        // Rotate back and forth looking for witnesses
        const lookDir = Math.sin(t * 3.0) * 1.5; // Wide sweeps
        if (t > 3.0) {
          this.heist.phase = 'approach';
          this.heist.startPos = { ...this.behavior.wanderTarget };
          this.heist.timer = 0;
        }
        return { x: this.behavior.wanderTarget.x, y: this.behavior.wanderTarget.y, rotation: lookDir, jump: 0 };

      case 'approach':
        // SNEAKILY approach target
        // Lerp from startPos to targetPos slowly
        const progress = Math.min(t / 4.0, 1.0); // 4 seconds to approach
        // Use ease-in-out
        const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        this.behavior.wanderTarget.x = this.heist.startPos.x + (this.heist.targetPos.x - this.heist.startPos.x) * ease;
        this.behavior.wanderTarget.y = this.heist.startPos.y + (this.heist.targetPos.y - this.heist.startPos.y) * ease;

        // Shifty rotation
        const shifty = Math.sin(t * 10) * 0.1;

        if (progress >= 1.0) {
          this.heist.phase = 'suck';
          this.heist.timer = 0;
        }
        return { x: this.behavior.wanderTarget.x, y: this.behavior.wanderTarget.y, rotation: shifty, jump: 0 };

      case 'suck':
        // VIBRATE INTENSELY
        const vibe = Math.sin(t * 50) * 0.1;
        if (t > 1.5) {
          // CRIME COMMITTED
          window.dispatchEvent(new CustomEvent('vizzy-perform-steal', { detail: { panelId: this.heist.targetPanel } }));
          this.heist.phase = 'flee';
          this.heist.timer = 0;
        }
        return { x: this.behavior.wanderTarget.x + vibe, y: this.behavior.wanderTarget.y + vibe, rotation: vibe * 2, jump: 0 };

      case 'flee':
        // RUN AWAY off screen (Assume Right side exit for drama, or away from panel)
        this.behavior.wanderTarget.x += 6.0 * deltaTime; // Move Right FAST
        this.behavior.wanderTarget.y += Math.sin(t * 10) * 0.5 * deltaTime; // Wobbly flight due to "full stomach"

        if (this.behavior.wanderTarget.x > 3.0) {
          this.heist.phase = 'returning_peek';
          this.heist.timer = 0;
        }
        return { x: this.behavior.wanderTarget.x, y: this.behavior.wanderTarget.y, rotation: 0, jump: 0 };

      case 'returning_peek':
        // Wait off screen for a bit
        if (t < 5.0) return { x: 3.0, y: 0, rotation: 0, jump: 0 };

        // Peek head in
        const targetPeek = 1.6;
        this.behavior.wanderTarget.x += (targetPeek - this.behavior.wanderTarget.x) * 2.0 * deltaTime;
        this.behavior.wanderTarget.y = 0;

        if (t > 8.0) {
          // Look around "real good and long"
          // Just rotation changes here?
        }

        if (t > 10.0) {
          this.heist.phase = 'returning_enter';
          this.heist.timer = 0;
        }
        // Head mostly hidden, look around
        return { x: this.behavior.wanderTarget.x, y: 0, rotation: Math.sin(t * 2) * 0.5, jump: 0 };

      case 'returning_enter':
        // Pop back in quickly like nothing happened
        this.behavior.wanderTarget.x += (0 - this.behavior.wanderTarget.x) * 3.0 * deltaTime;
        if (Math.abs(this.behavior.wanderTarget.x) < 0.1) {
          this.heist.active = false; // FINISHED
          this.behavior.emotionalState = 'calm';
        }
        return { x: this.behavior.wanderTarget.x, y: 0, rotation: 0, jump: 0 };
    }
    return null;
  }

  notifyUserAction(action: string) {
    this.behavior.lastInteraction = Date.now();
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes('good') || lowerAction.includes('pet') || lowerAction.includes('yes')) {
      this.behavior.emotionalState = 'excited';
    } else if (lowerAction.includes('stay') || lowerAction.includes('stop')) {
      this.behavior.emotionalState = 'calm';
    } else if (lowerAction.includes('fetch') || lowerAction.includes('look') || lowerAction.includes('come') || lowerAction.includes('here')) {
      this.behavior.emotionalState = 'following';
    } else {
      this.behavior.emotionalState = 'curious';
    }
  }
}
