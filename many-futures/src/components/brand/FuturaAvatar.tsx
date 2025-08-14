"use client";

import { useEffect, useRef } from 'react';

interface FuturaAvatarProps {
  size?: number;
  className?: string;
}

export function FuturaAvatar({ size = 60, className = "" }: FuturaAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Create gradient orb
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 2;

      // Animated gradient
      const gradient = ctx.createRadialGradient(
        centerX + Math.sin(time * 0.002) * 10,
        centerY + Math.cos(time * 0.002) * 10,
        0,
        centerX,
        centerY,
        radius
      );

      // Purple to blue gradient with animation
      const hue1 = 250 + Math.sin(time * 0.001) * 20;
      const hue2 = 270 + Math.cos(time * 0.001) * 20;
      
      gradient.addColorStop(0, `hsl(${hue1}, 70%, 60%)`);
      gradient.addColorStop(0.5, `hsl(${hue2}, 60%, 50%)`);
      gradient.addColorStop(1, `hsl(${hue1 + 20}, 50%, 40%)`);

      // Draw orb
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add subtle glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsl(${hue1}, 70%, 60%)`;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Add inner light spot
      const lightGradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        0,
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.4
      );
      lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = lightGradient;
      ctx.fill();

      time += 16; // Approximate 60fps
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className={`block ${className}`}
      style={{ width: size, height: size }}
    />
  );
}