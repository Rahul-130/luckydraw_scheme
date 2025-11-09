import { createRoot } from 'react-dom/client';

/**
 * Renders a React component into a new browser window for printing.
 * @param {React.ReactElement} component - The React component to print.
 * @param {string} title - The title of the new window.
 * @param {number} delay - The delay in milliseconds before triggering the print dialog.
 */
export const renderComponentInNewWindow = (component, title = 'Print', delay = 500) => {
  const printWindow = window.open('', '_blank', 'height=800,width=600');
  if (!printWindow) {
    console.error('Failed to open print window. Please check your browser pop-up settings.');
    return;
  }

  // Copy stylesheets from the main document to the new window
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(style => style.outerHTML)
    .join('');

  printWindow.document.write(`
    <html>
      <head><title>${title}</title>${styles}</head>
      <body><div id="print-root"></div></body>
    </html>`);
  printWindow.document.close();

  const printRoot = printWindow.document.getElementById('print-root');
  const root = createRoot(printRoot);
  root.render(component);

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, delay);
};
