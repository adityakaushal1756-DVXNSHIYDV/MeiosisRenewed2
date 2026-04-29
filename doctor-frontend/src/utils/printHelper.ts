import { assetUrl } from '../lib/api';

/**
 * Triggers a print dialog for a document at the given path.
 * Uses a Blob-based approach to ensure cross-browser compatibility.
 * 
 * @param path The relative path to the PDF asset
 * @param existingIframe Optional iframe element created during a user action to bypass Safari's async restrictions
 */
export const printDocument = async (path: string, existingIframe?: HTMLIFrameElement) => {
  if (!path) return;
  const rawUrl = assetUrl(path);
  
  // Appending toolbar=0 to hide the browser's PDF viewer controls (zoom, download, etc.)
  // This addresses the "zoom in and out button appear" feedback.
  const url = rawUrl + (rawUrl.includes('?') ? '&' : '#') + 'toolbar=0&navpanes=0&scrollbar=0';

  try {
    // 1. Fetch the PDF as a blob. This makes it a "local" same-origin resource,
    // which Safari is much more likely to allow for programmatic printing.
    const response = await fetch(rawUrl);
    if (!response.ok) throw new Error("Failed to fetch PDF");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // 2. Use the provided iframe (pre-warmed during click) or create a new one
    const iframe = existingIframe || document.createElement('iframe');
    if (!existingIframe) {
      iframe.style.position = 'fixed';
      iframe.style.right = '-1000px';
      iframe.style.bottom = '-1000px';
      iframe.style.width = '100px';
      iframe.style.height = '100px';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }
    
    iframe.src = blobUrl;

    const performPrint = () => {
      try {
        iframe.contentWindow?.focus();
        
        // SAFARI BYPASS: Safari triggers the "This web page is trying to print" popup 
        // when calling .print() on an iframe. Using execCommand('print') inside the 
        // iframe's document context can sometimes bypass this permission gate.
        if (isSafari && iframe.contentDocument) {
          try {
            // This is a specialized command that Safari often trusts more
            iframe.contentDocument.execCommand('print', false);
          } catch (e) {
            iframe.contentWindow?.print();
          }
        } else {
          iframe.contentWindow?.print();
        }
      } catch (err) {
        console.error("[Meiosis] Print failed:", err);
        // Fallback: if all else fails, open the PDF in a new tab
        window.open(rawUrl, '_blank');
      }

      // Cleanup
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        URL.revokeObjectURL(blobUrl);
      }, 30000); 
    };

    if (isSafari) {
      // Safari requires a significant delay for the internal PDF viewer to be ready for commands
      setTimeout(performPrint, 2500);
    } else {
      // Chrome/Firefox handle onload for PDFs quite well
      iframe.onload = performPrint;
      // Safety timeout for onload
      setTimeout(performPrint, 4000);
    }
  } catch (err) {
    console.error("[Meiosis] Print setup failed:", err);
    window.open(rawUrl, '_blank');
  }
};
