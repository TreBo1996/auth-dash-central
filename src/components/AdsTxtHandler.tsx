import { useEffect } from 'react';

const AdsTxtHandler = () => {
  useEffect(() => {
    // Set response headers and content for ads.txt
    const adsContent = "google.com, pub-3586730785374238, DIRECT, f08c47fec0942fa0\n";
    
    // Create a blob with the content
    const blob = new Blob([adsContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download or replace page content
    const handleResponse = () => {
      // Replace the entire document content
      document.open();
      document.write(adsContent);
      document.close();
      
      // Set proper content type
      if (document.contentType !== 'text/plain') {
        // For browsers that support it, try to set the content type
        try {
          (document as any).contentType = 'text/plain';
        } catch (e) {
          // Fallback: redirect to a data URL
          window.location.replace(`data:text/plain;charset=utf-8,${encodeURIComponent(adsContent)}`);
        }
      }
    };
    
    handleResponse();
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  return null;
};

export default AdsTxtHandler;