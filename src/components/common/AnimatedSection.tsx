import React, { useEffect, useState, useRef } from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  stagger?: boolean;
  staggerDelay?: number;
  immediate?: boolean;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  delay = 0,
  duration = 400,
  className = '',
  stagger = false,
  staggerDelay = 50,
  immediate = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion || immediate) {
      setTimeout(() => {
        setIsVisible(true);
        setHasAnimated(true);
      }, delay);
      return;
    }

    // Check if element is initially in viewport
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (inViewport) {
        setTimeout(() => {
          setIsVisible(true);
          setHasAnimated(true);
        }, delay);
        return;
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, delay);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px 0px -50px 0px',
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, hasAnimated, immediate]);

  const baseClasses = `transform transition-all ease-out ${
    isVisible 
      ? 'translate-y-0 opacity-100' 
      : 'translate-y-6 opacity-0'
  }`;

  const style = {
    transitionDuration: `${duration}ms`,
  };

  if (stagger && React.Children.count(children) > 1) {
    return (
      <div ref={elementRef} className={`${className}`}>
        {React.Children.map(children, (child, index) => (
          <div
            key={index}
            className={baseClasses}
            style={{
              ...style,
              transitionDelay: `${delay + (index * staggerDelay)}ms`,
            }}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      className={`${baseClasses} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};