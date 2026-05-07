import { assetUrl, getAuthHeader } from '../lib/api';

/**
 * Triggers a print dialog for a document at the given path.
 * Uses a Blob-based approach to ensure cross-browser compatibility.
 */
export const printDocument = async (path: string, existingIframe?: HTMLIFrameElement) => {
  if (!path) return;

  // Block print requests for generated PDFs
  if (path.includes('/pdf') || path.includes('/summary') || path.includes('/audit')) {
    alert("PDF generation is disabled pending system redesign.");
    return;
  }

  const rawUrl = assetUrl(path);
  const url = rawUrl + (rawUrl.includes('?') ? '&' : '#') + 'toolbar=0&navpanes=0&scrollbar=0';

  try {
    const response = await fetch(rawUrl, {
      headers: {
        ...getAuthHeader()
      }
    });
    if (!response.ok) throw new Error("Failed to fetch PDF");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

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
        if (isSafari && iframe.contentDocument) {
          try {
            iframe.contentDocument.execCommand('print', false);
          } catch (e) {
            iframe.contentWindow?.print();
          }
        } else {
          iframe.contentWindow?.print();
        }
      } catch (err) {
        console.error("[Meiosis] Print failed:", err);
        window.open(rawUrl, '_blank');
      }

      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        URL.revokeObjectURL(blobUrl);
      }, 30000); 
    };

    if (isSafari) {
      setTimeout(performPrint, 2500);
    } else {
      iframe.onload = performPrint;
      setTimeout(performPrint, 4000);
    }
  } catch (err) {
    console.error("[Meiosis] Print setup failed:", err);
    window.open(rawUrl, '_blank');
  }
};
