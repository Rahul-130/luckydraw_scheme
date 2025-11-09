/**
 * Opens a WhatsApp chat window with a pre-filled message.
 * @param {string} phone The recipient's phone number.
 * @param {string} message The message to send.
 */
export const sendWhatsAppMessage = (phone, message) => {
  if (!phone) {
    console.error("WhatsApp Error: Phone number is required.");
    return;
  }
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Generates and sends a WhatsApp message for a payment receipt summary.
 * @param {object} customer The customer object, containing name and phone.
 * @param {object} book The book object, containing the name.
 * @param {Array<object>} selectedPayments An array of payment objects.
 */
export const sendPaymentReceiptMessage = (customer, book, selectedPayments) => {
  const totalAmount = selectedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const message = `Hello ${customer.name}, here is a summary of your recent payments for book "${book.name}":\n\n` +
    selectedPayments.map(p => `- Receipt ${p.receiptNo} for ${p.monthIso}: ₹${Number(p.amount).toLocaleString('en-IN')}`).join('\n') +
    `\n\nTotal Paid: ₹${totalAmount.toLocaleString('en-IN')}\n\nThank you!`;
  
  sendWhatsAppMessage(customer.phone, message);
};

/**
 * Generates and sends a WhatsApp message to a lucky draw winner.
 * @param {object} customer The customer object with all necessary details.
 */
export const sendWinnerCongratulationsMessage = (customer) => {
  const message = `Congratulations ${customer.customerName}! You have been selected as a winner in the lucky draw for the book "${customer.bookName}". Your address is: ${customer.address}. Please collect your prize soon!`;
  sendWhatsAppMessage(customer.phone, message);
};

/**
 * Generates and sends a WhatsApp message when a customer is unmarked as a winner.
 * @param {object} customer The customer object with name and phone.
 */
export const sendUnmarkWinnerMessage = (customer) => {
  const message = `Hello ${customer.customerName}, your winner status for the lucky draw has been revoked. Please contact us for more details.`;
  sendWhatsAppMessage(customer.phone, message);
};
