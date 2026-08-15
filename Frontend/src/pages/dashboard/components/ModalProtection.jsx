import { useEffect } from 'react';

/**
 * Global component that observes the DOM for active modals.
 * When a modal is open:
 * 1. Disables overscroll behavior to prevent accidental pull-to-refresh on mobile.
 * 2. Hooks into beforeunload to prevent accidental tab closing/refreshing.
 */
export const ModalProtection = () => {
  useEffect(() => {
    // Selectors that indicate a modal is open
    const modalSelectors = [
      '.modal-overlay',
      '.selector-modal-overlay',
      '.pvm-overlay',
      '.modal-container',
      '[class*="modal-overlay"]',
      '[class*="ModalOverlay"]'
    ].join(', ');

    const isModalOpen = () => {
      return document.querySelector(modalSelectors) !== null;
    };

    const handleBeforeUnload = (e) => {
      if (isModalOpen()) {
        e.preventDefault();
        e.returnValue = ''; // Standard requirement for showing the "Are you sure you want to leave?" prompt
      }
    };

    const updateProtectionState = () => {
      if (isModalOpen()) {
        // Prevent pull-to-refresh on mobile
        document.body.style.overscrollBehaviorY = 'none';
        document.documentElement.style.overscrollBehaviorY = 'none';
      } else {
        // Restore normal behavior
        document.body.style.overscrollBehaviorY = '';
        document.documentElement.style.overscrollBehaviorY = '';
      }
    };

    // 1. Listen for attempts to close or reload the tab (Desktop/Mobile)
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Observe changes in the DOM to detect when modals appear or disappear
    const observer = new MutationObserver(() => {
      updateProtectionState();
    });

    // Start observing the body for added/removed children
    observer.observe(document.body, { childList: true, subtree: true });

    // 3. Initial check in case a modal is already open when this mounts
    updateProtectionState();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      observer.disconnect();
      document.body.style.overscrollBehaviorY = '';
      document.documentElement.style.overscrollBehaviorY = '';
    };
  }, []);

  return null; // This component is invisible
};

export default ModalProtection;
