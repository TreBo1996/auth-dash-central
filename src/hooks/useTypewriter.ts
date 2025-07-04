import { useState, useEffect } from 'react';

interface UseTypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
}

export const useTypewriter = ({ text, speed = 100, delay = 500 }: UseTypewriterProps) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let index = 0;

    const startTyping = () => {
      timer = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.substring(0, index + 1));
          index++;
        } else {
          setIsComplete(true);
          clearInterval(timer);
        }
      }, speed);
    };

    const delayTimer = setTimeout(startTyping, delay);

    return () => {
      clearTimeout(delayTimer);
      clearInterval(timer);
    };
  }, [text, speed, delay]);

  return { displayText, isComplete };
};