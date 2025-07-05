import { useState, useCallback, useRef, useEffect } from 'react';

interface RateLimitState {
  isRateLimited: boolean;
  cooldownEndsAt: number | null;
  failedAttempts: number;
  lastAttemptAt: number | null;
}

interface UseAuthRateLimitReturn {
  canAttempt: boolean;
  remainingCooldown: number;
  recordAttempt: (success: boolean, errorMessage?: string) => void;
  isRateLimit: (errorMessage: string) => boolean;
  reset: () => void;
  getErrorMessage: (originalError: string) => string;
  getCooldownMessage: () => string;
}

export const useAuthRateLimit = (): UseAuthRateLimitReturn => {
  const [state, setState] = useState<RateLimitState>({
    isRateLimited: false,
    cooldownEndsAt: null,
    failedAttempts: 0,
    lastAttemptAt: null,
  });
  const [currentTime, setCurrentTime] = useState(Date.now());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update current time every second when rate limited
  useEffect(() => {
    if (state.isRateLimited && state.cooldownEndsAt) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [state.isRateLimited, state.cooldownEndsAt]);

  // Check if error is rate limit related
  const isRateLimit = useCallback((errorMessage: string): boolean => {
    const rateLimitIndicators = [
      'email rate limit exceeded',
      'rate limit',
      '429',
      'too many requests',
      'over_email_send_rate_limit'
    ];
    
    return rateLimitIndicators.some(indicator => 
      errorMessage.toLowerCase().includes(indicator.toLowerCase())
    );
  }, []);

  // Calculate cooldown duration based on failed attempts
  const getCooldownDuration = useCallback((attempts: number): number => {
    // Exponential backoff: 30s, 60s, 120s, 300s (5min), then 300s max
    const durations = [30, 60, 120, 300];
    const index = Math.min(attempts - 1, durations.length - 1);
    return durations[index] * 1000; // Convert to milliseconds
  }, []);

  // Record an attempt and update rate limiting state
  const recordAttempt = useCallback((success: boolean, errorMessage?: string) => {
    const now = Date.now();
    
    setState(prev => {
      if (success) {
        // Reset on success
        return {
          isRateLimited: false,
          cooldownEndsAt: null,
          failedAttempts: 0,
          lastAttemptAt: now,
        };
      }

      const newFailedAttempts = prev.failedAttempts + 1;
      const isRateLimitError = errorMessage ? isRateLimit(errorMessage) : false;
      
      // Apply cooldown if it's a rate limit error or we have multiple failures
      const shouldApplyCooldown = isRateLimitError || newFailedAttempts >= 2;
      
      if (shouldApplyCooldown) {
        const cooldownDuration = getCooldownDuration(newFailedAttempts);
        const cooldownEndsAt = now + cooldownDuration;
        
        return {
          isRateLimited: true,
          cooldownEndsAt,
          failedAttempts: newFailedAttempts,
          lastAttemptAt: now,
        };
      }

      return {
        ...prev,
        failedAttempts: newFailedAttempts,
        lastAttemptAt: now,
      };
    });
  }, [isRateLimit, getCooldownDuration]);

  // Calculate remaining cooldown time
  const remainingCooldown = state.cooldownEndsAt 
    ? Math.max(0, Math.ceil((state.cooldownEndsAt - currentTime) / 1000))
    : 0;

  // Check if user can attempt
  const canAttempt = !state.isRateLimited || remainingCooldown <= 0;

  // Update state when cooldown expires
  if (state.isRateLimited && remainingCooldown <= 0) {
    setState(prev => ({
      ...prev,
      isRateLimited: false,
      cooldownEndsAt: null,
    }));
  }

  // Reset all state
  const reset = useCallback(() => {
    setState({
      isRateLimited: false,
      cooldownEndsAt: null,
      failedAttempts: 0,
      lastAttemptAt: null,
    });
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Get enhanced error message
  const getErrorMessage = useCallback((originalError: string): string => {
    if (isRateLimit(originalError)) {
      return "Too many signup attempts. Please wait before trying again to avoid email rate limits.";
    }
    
    if (originalError.toLowerCase().includes('captcha')) {
      return "Captcha verification failed. Please try the captcha again.";
    }
    
    return originalError;
  }, [isRateLimit]);

  // Get cooldown message
  const getCooldownMessage = useCallback((): string => {
    if (!state.isRateLimited || remainingCooldown <= 0) return '';
    
    const minutes = Math.floor(remainingCooldown / 60);
    const seconds = remainingCooldown % 60;
    
    if (minutes > 0) {
      return `Please wait ${minutes}m ${seconds}s before trying again`;
    }
    return `Please wait ${seconds}s before trying again`;
  }, [state.isRateLimited, remainingCooldown]);

  return {
    canAttempt,
    remainingCooldown,
    recordAttempt,
    isRateLimit,
    reset,
    getErrorMessage,
    getCooldownMessage,
  };
};