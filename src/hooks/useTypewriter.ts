import { useState, useEffect } from 'react';

/**
 * A custom React hook that simulates a typewriter effect for a given string.
 *
 * @param {string} text The full text to be typed out.
 * @param {number} [speed=30] The delay in milliseconds between each character.
 * @returns {string} The portion of the text to be displayed at the current time.
 */
export const useTypewriter = (text: string, speed: number = 10) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText(''); // Reset display text when the source text changes
    let i = 0;
    const timerId = setInterval(() => {
      if (i < text.length) {
        setDisplayText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timerId);
      }
    }, speed);

    return () => {
      clearInterval(timerId); // Cleanup on component unmount
    };
  }, [text, speed]);

  return displayText;
}; 