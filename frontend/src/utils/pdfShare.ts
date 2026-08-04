export const generatePdfFromHtml = async (htmlContent: string, filename: string): Promise<Blob | null> => {
  if (typeof window === 'undefined') return null;

  try {
    // Dynamic import to avoid SSR issues
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default;
    // Create an off-screen container to guarantee dimensions for html2canvas
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'fixed';
    container.style.top = '100vh'; // Move it completely below the viewport
    container.style.left = '0';
    container.style.width = '794px'; // Explicit A4 pixel width at 96 DPI
    container.style.zIndex = '-9999';
    document.body.appendChild(container);

    const opt = {
      margin:       0, // Handled within the HTML template
      filename:     filename,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    const pdfBlob = await html2pdf().set(opt).from(container).outputPdf('blob');
    
    // Cleanup container
    document.body.removeChild(container);
    
    return pdfBlob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};

export const sharePdfViaWhatsApp = async (pdfBlob: Blob, filename: string, phone: string, text: string) => {
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  // Try Web Share API (mostly works on mobile)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
        text: text,
      });
      return true; // Shared successfully
    } catch (error: any) {
      if (error.name !== 'AbortError') {
         console.error('Error sharing via Web Share API:', error);
      }
      return false; // User cancelled or error
    }
  }

  // Fallback for Desktop: Auto-download the file, then open WhatsApp Web
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Clean the phone number (remove non-digits, optional: ensure country code)
  let cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  if (cleanPhone && !cleanPhone.startsWith('91') && cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
  }

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  
  // Open WhatsApp in a new tab
  window.open(waUrl, '_blank');
  
  return true;
};
