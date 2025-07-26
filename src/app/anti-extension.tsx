'use client';

import { useEffect } from 'react';

/**
 * Component to prevent browser extension interference
 */
export default function AntiExtension() {
  useEffect(() => {
    // Remove any unwanted classes added by extensions
    const removeExtensionClasses = () => {
      const html = document.documentElement;
      const unwantedClasses = [
        'tc-new-price',
        'textcortex-extension',
        'grammarly-desktop-integration',
        'notion-extension'
      ];
      
      unwantedClasses.forEach(className => {
        if (html.classList.contains(className)) {
          html.classList.remove(className);
        }
      });
    };

    // Initial cleanup
    removeExtensionClasses();

    // Monitor for dynamic class additions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          removeExtensionClasses();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
} 