interface AutonomousBehavior {
  wanderTarget: { x: number; y: number };
  mousePos: { x: number; y: number };
  emotionalState: 'calm' | 'curious' | 'excited' | 'following' | 'pouncing' | 'nuzzling' | 'nap';
  lastInteraction: number;
  jumpTimer: number;
  pounceTimer: number;
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

    // Update emotional state based on activity
    if (userActive) {
      this.behavior.lastInteraction = now;
      if (this.behavior.emotionalState === 'nap') this.behavior.emotionalState = 'curious';

      const distToMouse = Math.sqrt(
        (this.behavior.mousePos.x - this.behavior.wanderTarget.x) ** 2 +
        (this.behavior.mousePos.y - this.behavior.wanderTarget.y) ** 2
      );

      if (distToMouse < 0.2 && Math.random() < 0.05) {
        this.behavior.emotionalState = 'nuzzling';
      } else if (distToMouse > 0.8) {
        this.behavior.emotionalState = 'following';
      } else if (Math.random() < 0.01) {
        this.behavior.emotionalState = 'pouncing';
      }
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

    return { ...movement, jump };
  }

  private pickWanderTarget() {
    // Goldfish Logic: Bias towards left side (Home) but explore
    const isHome = Math.random() < 0.6; // 60% Home preference

    let targetX;
    if (isHome) {
      // Left "Bowl" area: -1.2 to -0.2
      targetX = -1.2 + Math.random() * 1.0;
    } else {
      // "Open Water": -0.8 to 1.2
      targetX = -0.8 + Math.random() * 2.0;
    }

    this.wanderState.target = {
      x: targetX,
      y: (Math.random() - 0.5) * 1.6
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

  notifyUserAction(action: string) {
    this.behavior.lastInteraction = Date.now();
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes('good') || lowerAction.includes('pet') || lowerAction.includes('yes')) {
      this.behavior.emotionalState = 'excited';
    } else if (lowerAction.includes('stay') || lowerAction.includes('stop')) {
      this.behavior.emotionalState = 'calm';
    } else if (lowerAction.includes('fetch') || lowerAction.includes('look')) {
      this.behavior.emotionalState = 'following';
    } else {
      this.behavior.emotionalState = 'curious';
    }
  }
}
