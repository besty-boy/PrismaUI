import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

export interface MicroInteractionOptions {
  gpu?: boolean; // Enable GPU acceleration
  performance?: 'auto' | 'high' | 'balanced' | 'economy'; // Performance mode
  prefersReducedMotion?: boolean; // Respect user preferences
  hover?: {
    scale?: number;
    rotate?: number;
    translateY?: number;
    brightness?: number;
    saturate?: number;
    blur?: number;
    duration?: number;
    easing?: string;
  };
  focus?: {
    scale?: number;
    glow?: boolean;
    glowColor?: string;
    borderScale?: number;
    duration?: number;
  };
  active?: {
    scale?: number;
    rotate?: number;
    duration?: number;
    feedback?: 'haptic' | 'visual' | 'both';
  };
  disabled?: {
    opacity?: number;
    scale?: number;
    filter?: string;
  };
  loading?: {
    animation?: 'spin' | 'pulse' | 'bounce' | 'dots';
    duration?: number;
  };
  magnetic?: {
    strength?: number;
    distance?: number;
  };
  ripple?: {
    color?: string;
    duration?: number;
    scale?: number;
  };
  tilt?: {
    maxTilt?: number;
    scale?: number;
    speed?: number;
  };
}

export const useMicroInteractions = (options: MicroInteractionOptions = {}) => {
  const ref = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();

  const {
    gpu = true,
    performance = 'auto',
    prefersReducedMotion = false,
    hover = {},
    focus = {},
    active = {},
    loading = {},
    magnetic = {},
    ripple = {},
    tilt = {}
  } = options;

  // Performance detection
  const effectivePerformance = useMemo(() => {
    if (performance !== 'auto') return performance;
    
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = (navigator as any).hardwareConcurrency || 4;
    const connectionType = (navigator as any).connection?.effectiveType || '4g';
    
    if (deviceMemory < 2 || hardwareConcurrency < 2 || connectionType === 'slow-2g') {
      return 'economy';
    } else if (deviceMemory >= 8 && hardwareConcurrency >= 8 && connectionType === '4g') {
      return 'high';
    }
    return 'balanced';
  }, [performance]);

  // Check for reduced motion preference
  const shouldReduceMotion = useMemo(() => {
    return prefersReducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, [prefersReducedMotion]);

  // GPU optimization setup
  const setupGPUOptimization = useCallback(() => {
    if (!ref.current || !gpu) return;

    const element = ref.current;
    
    // Apply GPU acceleration properties
    element.style.willChange = 'transform, opacity, filter';
    element.style.backfaceVisibility = 'hidden';
    element.style.perspective = '1000px';
    
    // Adjust based on performance mode
    if (effectivePerformance === 'economy') {
      element.style.transformStyle = 'flat';
    } else {
      element.style.transformStyle = 'preserve-3d';
    }
  }, [gpu, effectivePerformance]);

  // Initialize GPU optimization
  useEffect(() => {
    setupGPUOptimization();
    
    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (ref.current && gpu) {
        ref.current.style.willChange = 'auto';
      }
    };
  }, [setupGPUOptimization, gpu]);

  // Default values
  const hoverDefaults = {
    scale: 1.02,
    rotate: 0,
    translateY: -2,
    brightness: 1.1,
    saturate: 1.1,
    blur: 0,
    duration: 200,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    ...hover
  };

  const focusDefaults = {
    scale: 1.02,
    glow: true,
    glowColor: '#3B82F6',
    borderScale: 1.1,
    duration: 200,
    ...focus
  };

  const activeDefaults = {
    scale: 0.95,
    rotate: 0,
    duration: 100,
    feedback: 'visual' as const,
    ...active
  };

  // const disabledDefaults = {
  //   opacity: 0.6,
  //   scale: 1,
  //   filter: 'grayscale(0.5)',
  //   ...disabled
  // };

  const loadingDefaults = {
    animation: 'spin' as const,
    duration: 1000,
    ...loading
  };

  const magneticDefaults = {
    strength: 0.5,
    distance: 100,
    ...magnetic
  };

  const rippleDefaults = {
    color: 'rgba(255, 255, 255, 0.6)',
    duration: 600,
    scale: 2,
    ...ripple
  };

  const tiltDefaults = {
    maxTilt: 10,
    scale: 1.02,
    speed: 400,
    ...tilt
  };

  // Performance-aware hover effects
  const applyHoverEffects = useCallback(() => {
    if (!ref.current || shouldReduceMotion) return;

    const element = ref.current;
    const gpuTransform = gpu ? 'translateZ(0)' : '';
    
    // Adjust effects based on performance mode
    const getEffectScale = () => {
      switch (effectivePerformance) {
        case 'economy': return 0.5;
        case 'balanced': return 0.8;
        case 'high': return 1.0;
        default: return 0.8;
      }
    };
    
    const effectScale = getEffectScale();
    const adjustedDuration = shouldReduceMotion ? 1 : hoverDefaults.duration * effectScale;

    if (isHovered) {
      const scale = 1 + (hoverDefaults.scale - 1) * effectScale;
      const translateY = hoverDefaults.translateY * effectScale;
      const brightness = 1 + (hoverDefaults.brightness - 1) * effectScale;
      
      const transform = `scale(${scale}) rotate(${hoverDefaults.rotate}deg) translateY(${translateY}px) ${gpuTransform}`;
      const filter = effectivePerformance !== 'economy' ? 
        `brightness(${brightness}) saturate(${hoverDefaults.saturate}) blur(${hoverDefaults.blur}px)` : 
        'none';
      
      element.style.transform = transform;
      element.style.filter = filter;
      element.style.transition = `all ${adjustedDuration}ms ${hoverDefaults.easing}`;
    } else {
      element.style.transform = gpu ? `translateZ(0)` : '';
      element.style.filter = 'none';
    }
  }, [isHovered, hoverDefaults, shouldReduceMotion, effectivePerformance, gpu]);

  // Apply hover effects
  useEffect(() => {
    applyHoverEffects();
  }, [applyHoverEffects]);

  // Apply focus effects
  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    if (isFocused) {
      if (focusDefaults.glow) {
        element.style.boxShadow = `0 0 20px ${focusDefaults.glowColor}`;
      }
      element.style.transform = `scale(${focusDefaults.scale})`;
      element.style.transition = `all ${focusDefaults.duration}ms ease-out`;
    } else {
      element.style.boxShadow = 'none';
    }
  }, [isFocused, focusDefaults]);

  // Apply active effects
  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    if (isActive) {
      const transform = `scale(${activeDefaults.scale}) rotate(${activeDefaults.rotate}deg)`;
      element.style.transform = transform;
      element.style.transition = `all ${activeDefaults.duration}ms ease-out`;

      // Haptic feedback
      if (activeDefaults.feedback === 'haptic' || activeDefaults.feedback === 'both') {
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    }
  }, [isActive, activeDefaults]);

  // Loading animation
  useEffect(() => {
    if (!ref.current || !isLoading) return;

    const element = ref.current;
    const { animation, duration } = loadingDefaults;

    const keyframes = {
      spin: [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
      ],
      pulse: [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.05)', opacity: 0.8 },
        { transform: 'scale(1)', opacity: 1 }
      ],
      bounce: [
        { transform: 'translateY(0)' },
        { transform: 'translateY(-10px)' },
        { transform: 'translateY(0)' }
      ],
      dots: [
        { opacity: 0.4 },
        { opacity: 1 },
        { opacity: 0.4 }
      ]
    };

    const anim = element.animate(keyframes[animation], {
      duration,
      iterations: Infinity,
      easing: 'ease-in-out'
    });

    return () => anim.cancel();
  }, [isLoading, loadingDefaults]);

  // Magnetic effect
  useEffect(() => {
    if (!ref.current || !magneticDefaults.strength) return;

    const element = ref.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < magneticDefaults.distance) {
        const strength = magneticDefaults.strength;
        const translateX = (deltaX / distance) * strength * (magneticDefaults.distance - distance);
        const translateY = (deltaY / distance) * strength * (magneticDefaults.distance - distance);
        
        element.style.transform = `translate(${translateX}px, ${translateY}px)`;
      } else {
        element.style.transform = 'translate(0, 0)';
      }
    };

    const handleMouseLeave = () => {
      element.style.transform = 'translate(0, 0)';
    };

    document.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [magneticDefaults]);

  // Ripple effect
  const createRipple = (e: React.MouseEvent) => {
    if (!ref.current) return;

    const element = ref.current;
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: ${rippleDefaults.color};
      transform: scale(0);
      animation: ripple-animation ${rippleDefaults.duration}ms ease-out;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
    `;

    // Add ripple animation keyframes
    if (!document.querySelector('#ripple-keyframes')) {
      const style = document.createElement('style');
      style.id = 'ripple-keyframes';
      style.textContent = `
        @keyframes ripple-animation {
          to {
            transform: scale(${rippleDefaults.scale});
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    element.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, rippleDefaults.duration);
  };

  // Tilt effect
  useEffect(() => {
    if (!ref.current || !tiltDefaults.maxTilt) return;

    const element = ref.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);
      
      const tiltX = deltaY * tiltDefaults.maxTilt;
      const tiltY = deltaX * tiltDefaults.maxTilt;

      element.style.transform = `
        perspective(1000px) 
        rotateX(${-tiltX}deg) 
        rotateY(${tiltY}deg) 
        scale(${tiltDefaults.scale})
      `;
      element.style.transition = `transform ${tiltDefaults.speed}ms ease-out`;
    };

    const handleMouseLeave = () => {
      element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [tiltDefaults]);

  // Event handlers
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleMouseDown = () => setIsActive(true);
  const handleMouseUp = () => setIsActive(false);
  const handleClick = (e: React.MouseEvent) => {
    if (rippleDefaults.color) {
      createRipple(e);
    }
  };

  return {
    ref,
    isHovered,
    isFocused,
    isActive,
    isLoading,
    setIsLoading,
    mousePosition,
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onClick: handleClick
    }
  };
};