// components/shaders/planetShaders.ts

export const proceduralVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const proceduralFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  uniform vec3 uColorWater;
  uniform vec3 uColorSand;
  uniform vec3 uColorGrass;
  uniform vec3 uColorMountain;
  uniform vec3 uColorSnow;
  uniform vec3 uColorCity;
  uniform vec3 uLightDirection;

  // Simplex Noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      vec3 i_ = mod289(i);
      vec4 p = permute( permute( permute( i_.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i_.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i_.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
  }

  float fbm(vec3 x, int octaves) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; ++i) {
      if(i >= octaves) break;
      v += a * snoise(x);
      x = x * 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float height = fbm(vPosition * 2.5, 6);
    float detail = fbm(vPosition * 40.0, 4);
    float diffuse = max(dot(vNormal, uLightDirection), 0.0);
    vec3 finalColor;
    float oceanLevel = 0.15; 
    
    if (height < oceanLevel) {
      finalColor = uColorWater;
      float wave = snoise(vPosition * 50.0);
      finalColor += vec3(0.02) * wave;
      vec3 viewDir = normalize(-vPosition);
      vec3 reflectDir = reflect(-uLightDirection, vNormal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
      finalColor += vec3(0.5) * spec; 
    } else {
      float t = (height - oceanLevel) / (1.0 - oceanLevel);
      if (t < 0.05) {
         finalColor = uColorSand;
      } else if (t < 0.45) {
         vec3 landColor = mix(uColorSand, uColorGrass, (t - 0.05) / 0.4);
         float cityNoise = smoothstep(0.4, 0.8, detail); 
         float ruralNoise = smoothstep(0.0, 0.4, detail); 
         vec3 ruralColor = mix(landColor, vec3(0.35, 0.45, 0.25), 0.5);
         landColor = mix(landColor, ruralColor, ruralNoise);
         if (t < 0.35 && cityNoise > 0.6) {
           finalColor = mix(landColor, uColorCity, 0.8);
           if (diffuse < 0.2) {
              finalColor += uColorCity * 0.5;
           }
         } else {
           finalColor = landColor;
         }
      } else if (t < 0.7) {
         finalColor = mix(uColorGrass, uColorMountain, (t - 0.45) / 0.25);
      } else {
         finalColor = mix(uColorMountain, uColorSnow, (t - 0.7) / 0.3);
      }
    }
    gl_FragColor = vec4(finalColor * (0.2 + 0.8 * diffuse), 1.0);
  }
`;
