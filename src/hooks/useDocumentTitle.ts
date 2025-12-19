import { useEffect } from 'react';

const SITE_NAME = 'Dubai Invest Pro';

export const useDocumentTitle = (title?: string) => {
  useEffect(() => {
    const previousTitle = document.title;
    
    if (title) {
      document.title = `${title} | ${SITE_NAME}`;
    } else {
      document.title = `${SITE_NAME} | AI-Powered Real Estate Investment Platform`;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};

export default useDocumentTitle;
