---
name: webgl-experience
description: Design or implement a WebGL visual for the portfolio. Use when adding or changing a canvas, shader, 3D scene, or rich interactive visual.
---

# WebGL experience

Create a distinctive visual that supports the portfolio’s story and leaves its content accessible.

- Keep essential text and navigation in semantic HTML outside the canvas.
- Provide a useful static fallback when WebGL, JavaScript, or animation is unavailable. Respect `prefers-reduced-motion` and avoid requiring pointer input.
- Load rendering code only where needed, cap pixel density, pause when the page is hidden or the scene is offscreen, and dispose listeners and GPU resources on teardown.
- Check the experience on touch and keyboard layouts as well as desktop. Preserve a clear contrast between foreground content and the visual.
- Prefer the smallest implementation that achieves the brief; explain any new rendering dependency.
