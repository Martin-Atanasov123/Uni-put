/**
 * ShaderBackground — Plasma grid WebGL background
 * Source: https://21st.dev/r/minhxthanh/animated-shader-background
 * Adapted: container-relative sizing, ResizeObserver, proper RAF cleanup.
 * Uses raw WebGL (no Three.js dependency).
 */

// ── Shaders (outside component — never recreated) ────────────────────────────

const VS_SOURCE = `
  attribute vec4 aVertexPosition;
  void main() {
    gl_Position = aVertexPosition;
  }
`;

const FS_SOURCE = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;

  const float overallSpeed       = 0.2;
  const float gridSmoothWidth    = 0.015;
  const float axisWidth          = 0.05;
  const float majorLineWidth     = 0.025;
  const float minorLineWidth     = 0.0125;
  const float majorLineFrequency = 5.0;
  const float minorLineFrequency = 1.0;
  const vec4  gridColor          = vec4(0.5);
  const float scale              = 5.0;
  // line color computed per-line in main() loop
  const float minLineWidth       = 0.01;
  const float maxLineWidth       = 0.2;
  const float lineSpeed          = 0.5  * overallSpeed;
  const float lineAmplitude      = 1.0;
  const float lineFrequency      = 0.2;
  const float warpSpeed          = 0.1  * overallSpeed;
  const float warpFrequency      = 0.5;
  const float warpAmplitude      = 1.0;
  const float offsetFrequency    = 0.5;
  const float offsetSpeed        = 0.27 * overallSpeed;
  const float minOffsetSpread    = 0.6;
  const float maxOffsetSpread    = 2.0;
  const int   linesPerGroup      = 14;

  #define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
  #define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
  #define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))
  #define drawPeriodicLine(freq, width, t) drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))

  float drawGridLines(float axis) {
    return drawCrispLine(0.0, axisWidth, axis)
         + drawPeriodicLine(majorLineFrequency, majorLineWidth, axis)
         + drawPeriodicLine(minorLineFrequency, minorLineWidth, axis);
  }

  float drawGrid(vec2 space) {
    return min(1.0, drawGridLines(space.x) + drawGridLines(space.y));
  }

  float random(float t) {
    return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
  }

  float getPlasmaY(float x, float horizontalFade, float offset) {
    return random(x * lineFrequency + iTime * lineSpeed) * horizontalFade * lineAmplitude + offset;
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec4 fragColor;
    vec2 uv    = fragCoord.xy / iResolution.xy;
    vec2 space = (fragCoord - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

    float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
    float verticalFade   = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

    space.y += random(space.x * warpFrequency + iTime * warpSpeed) * warpAmplitude * (0.5 + horizontalFade);
    space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0) * warpAmplitude * horizontalFade;

    vec4 lines    = vec4(0.0);
    vec4 bgColor1 = vec4(0.059, 0.090, 0.165, 1.0);
    vec4 bgColor2 = vec4(0.063, 0.039, 0.137, 1.0);
    vec4 brandCyan   = vec4(0.024, 0.714, 0.831, 1.0);
    vec4 brandViolet = vec4(0.545, 0.361, 0.965, 1.0);

    for (int l = 0; l < linesPerGroup; l++) {
      float normalizedLineIndex = float(l) / float(linesPerGroup);
      float offsetTime          = iTime * offsetSpeed;
      float offsetPosition      = float(l) + space.x * offsetFrequency;
      float rand                = random(offsetPosition + offsetTime) * 0.5 + 0.5;
      float halfWidth           = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
      float offset              = random(offsetPosition + offsetTime * (1.0 + normalizedLineIndex))
                                  * mix(minOffsetSpread, maxOffsetSpread, horizontalFade);
      float linePosition        = getPlasmaY(space.x, horizontalFade, offset);
      float line                = drawSmoothLine(linePosition, halfWidth, space.y) / 2.0
                                + drawCrispLine(linePosition, halfWidth * 0.15, space.y);

      float circleX        = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
      vec2  circlePosition = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset));
      float circle         = drawCircle(circlePosition, 0.01, space) * 4.0;

      vec4 lineCol = mix(brandCyan, brandViolet, normalizedLineIndex);
      line  += circle;
      lines += line * lineCol * rand * 0.75;
    }

    fragColor    = mix(bgColor1, bgColor2, uv.x);
    fragColor   *= verticalFade;
    fragColor.a  = 1.0;
    fragColor   += lines;

    gl_FragColor = fragColor;
  }
`;

// ── WebGL helpers (pure functions, no React) ─────────────────────────────────

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSrc, fsSrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER,   vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

// ── Component ─────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';

export default function AnoAI({ style, className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let rafId;
    let ro;
    let timerId;

    const init = () => {
      const gl = canvas.getContext('webgl');
      if (!gl) return;

      const program = createProgram(gl, VS_SOURCE, FS_SOURCE);
      if (!program) return;

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
      );

      const vertexLoc     = gl.getAttribLocation(program,  'aVertexPosition');
      const resolutionLoc = gl.getUniformLocation(program, 'iResolution');
      const timeLoc       = gl.getUniformLocation(program, 'iTime');

      const resize = () => {
        const { width, height } = canvas.getBoundingClientRect();
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width  = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
      };

      ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();

      const startTime = Date.now();

      const render = () => {
        const t = (Date.now() - startTime) / 1000;
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
        gl.uniform1f(timeLoc, t);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexLoc);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        rafId = requestAnimationFrame(render);
      };

      rafId = requestAnimationFrame(render);
    };

    // Delay init so the LCP element (H1) can paint before WebGL competes for the main thread
    timerId = setTimeout(init, 350);

    return () => {
      clearTimeout(timerId);
      if (rafId) cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
