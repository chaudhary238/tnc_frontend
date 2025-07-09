import { useState, useEffect, useRef } from 'react';

/**
 * A custom React hook that simulates a typewriter effect for a given string.
 *
 * @param {string} text The full text to be typed out.
 * @param {number} [speed=10] The delay in milliseconds between each character.
 * @returns {string} The portion of the text to be displayed at the current time.
 */
export const useTypewriter = (text: string, speed: number = 10) => {
  const [displayText, setDisplayText] = useState('');
  const index = useRef(0);

  useEffect(() => {
    setDisplayText('');
    index.current = 0;
    const timerId = setInterval(() => {
      const newIndex = index.current + 1;
      if (newIndex <= text.length) {
        setDisplayText(text.substring(0, newIndex));
        index.current = newIndex;
      } else {
        clearInterval(timerId);
      }
    }, speed);

    return () => {
      clearInterval(timerId);
    };
  }, [text, speed]);

  return displayText;
}; 