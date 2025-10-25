/**
 * Formats a phone number and opens a WhatsApp chat with a pre-filled message.
 * Handles Indian phone numbers by ensuring the '91' prefix.
 * @param {string} phone - The customer's raw phone number.
 * @param {string} message - The message to be sent.
 */
export const sendWhatsAppMessage = (phone, message) => {
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
        formattedPhone = `91${formattedPhone}`;
    }
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};
