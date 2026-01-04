import { createContext, useContext, useState, useEffect } from 'react';

const TextSizeContext = createContext();

const TEXT_SIZES = {
  small: { label: 'S', scale: 0.875 },
  normal: { label: 'M', scale: 1 },
  large: { label: 'L', scale: 1.125 },
  xlarge: { label: 'XL', scale: 1.25 },
};

export function TextSizeProvider({ children }) {
  const [textSize, setTextSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('textSize') || 'normal';
    }
    return 'normal';
  });

  useEffect(() => {
    localStorage.setItem('textSize', textSize);
    document.documentElement.setAttribute('data-text-size', textSize);

    // Apply scale to root font size
    const scale = TEXT_SIZES[textSize]?.scale || 1;
    document.documentElement.style.fontSize = `${scale * 14}px`;
  }, [textSize]);

  return (
    <TextSizeContext.Provider value={{ textSize, setTextSize, TEXT_SIZES }}>
      {children}
    </TextSizeContext.Provider>
  );
}

export const useTextSize = () => {
  const context = useContext(TextSizeContext);
  if (!context) {
    return { textSize: 'normal', setTextSize: () => {}, TEXT_SIZES };
  }
  return context;
};
