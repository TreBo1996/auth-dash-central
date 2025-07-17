import React, { useEffect, useState, useRef } from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  stagger?: boolean;
  staggerDelay?: number;
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  delay = 0,
  duration = 400,
  className = '',
  stagger = false,
  staggerDelay = 50,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setIsVisible(true);
      setHasAnimated(true);
      return;
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
        rootMargin: '50px 0px -50px 0px',
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, hasAnimated]);

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