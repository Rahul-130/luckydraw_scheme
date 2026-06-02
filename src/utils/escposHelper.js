/**
 * Utility to generate ESC/POS binary data and send to USB printer
 */

const ESC = '\u001b';
const GS = '\u001d';

export const generateEscPos = (payment, customer, book, user) => {
  const encoder = new TextEncoder();
  let cmds = '';

  // Initialize printer
  cmds += ESC + '@';
  
  // Header - Bold & Large
  cmds += ESC + 'a' + '\u0001'; // Center align
  if (user?.company_name) {
    cmds += GS + '!' + '\u0011'; // Double height & width
    cmds += user.company_name.toUpperCase() + '\n';
    cmds += GS + '!' + '\u0000'; // Normal size
  }
  if (user?.company_address) cmds += user.company_address + '\n';
  const contactList = [user?.company_cell, user?.company_phone].filter(Boolean);
  if (contactList.length > 0) {
    cmds += 'Contacts: ' + contactList.join(', ') + '\n';
  }
  cmds += '-'.repeat(32) + '\n';

  // Info Section - Left align
  cmds += ESC + 'a' + '\u0000'; 
  cmds += `Group: ${book?.name || 'N/A'}\n`;
  cmds += `Cust:    ${customer?.name || 'N/A'}\n`;
  cmds += `Cust ID: ${customer?.id || ''}\n`;
  if (customer?.relationInfo) cmds += `S/o,W/o: ${customer.relationInfo}\n`;
  if (customer?.phone) cmds += `Phone: ${customer.phone}\n`;
  if (customer?.address) cmds += `Addr:  ${customer.address}\n`;
  cmds += '-'.repeat(32) + '\n';

  // Payment Details
  cmds += ESC + 'E' + '\u0001'; // Bold ON
  cmds += `RECEIPT NO: ${payment.receiptNo}\n`;
  cmds += ESC + 'E' + '\u0000'; // Bold OFF
  cmds += `Date:  ${new Date(payment.paymentDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}\n`;
  cmds += `Month: ${payment.monthIso}\n`;
  cmds += `Agent: ${payment.agentName}\n`;
  
  // Mode of Payment Details (Split Details)
  if (Number(payment.amountCash) > 0 || Number(payment.amountOnline) > 0 || Number(payment.amountInstore) > 0) {
    cmds += '\nPayment Breakdown:\n';
    if (Number(payment.amountCash) > 0) cmds += ` - Cash:   RS.${payment.amountCash}\n`;
    if (Number(payment.amountOnline) > 0) cmds += ` - Online: RS.${payment.amountOnline}\n`;
    if (Number(payment.amountInstore) > 0) cmds += ` - Store:  RS.${payment.amountInstore}\n`;
  }
  
  cmds += '-'.repeat(32) + '\n';
  
  // Total
  cmds += ESC + 'a' + '\u0002'; // Right align
  cmds += GS + '!' + '\u0011'; // Double height & width
  cmds += `TOTAL: RS.${payment.amount}\n`;
  cmds += GS + '!' + '\u0000'; // Normal size
  
  // Footer
  cmds += ESC + 'a' + '\u0001'; // Center align
  cmds += '\nThank You!\n';
  cmds += '\n\n\n\n'; // Feed lines
  cmds += GS + 'V' + '\u0000'; // Full cut

  return encoder.encode(cmds);
};

export const generateSettlementEscPos = (customer, book, user) => {
  const encoder = new TextEncoder();
  let cmds = '';
  const totalSettlement = Number(customer.totalPaid || 0) + Number(customer.bonusAmount || 0);

  // Initialize printer
  cmds += ESC + '@';
  
  // Header - Center align
  cmds += ESC + 'a' + '\u0001'; 
  if (user?.company_name) {
    cmds += GS + '!' + '\u0011'; // Double height & width
    cmds += user.company_name.toUpperCase() + '\n';
    cmds += GS + '!' + '\u0000'; // Normal size
  }
  if (user?.company_address) cmds += user.company_address + '\n';
  const contactList = [user?.company_cell, user?.company_phone].filter(Boolean);
  if (contactList.length > 0) {
    cmds += 'Contacts: ' + contactList.join(', ') + '\n';
  }
  cmds += '-'.repeat(32) + '\n';

  // Settlement Info
  cmds += ESC + 'a' + '\u0001'; // Center
  cmds += GS + '!' + '\u0001'; // Double height
  cmds += 'SETTLEMENT RECEIPT\n';
  cmds += GS + '!' + '\u0000'; // Normal size
  cmds += ESC + 'a' + '\u0000'; // Left align
  
  cmds += `Rec No: ${customer.settlementReceiptNo || 'N/A'}\n`;
  cmds += `Date:   ${new Date(customer.settledDate || Date.now()).toLocaleDateString('en-IN')}\n`;
  cmds += `Agent:  ${customer.settlementAgentName || 'N/A'}\n`;
  
  cmds += '\n' + ESC + 'a' + '\u0001'; // Center
  cmds += ESC + 'E' + '\u0001'; // Bold
  cmds += customer.isWinner ? 'STATUS: PRIZE COLLECTED\n' : 'STATUS: ACCOUNT SETTLED\n';
  cmds += ESC + 'E' + '\u0000'; // Bold OFF
  cmds += ESC + 'a' + '\u0000'; // Left align
  cmds += '-'.repeat(32) + '\n';

  // Customer Details
  cmds += `Cust:  ${customer.name}\n`;
  cmds += `Cust ID: ${customer.id}\n`;
  cmds += `Phone:   ${customer.phone}\n`;
  if (customer.address) cmds += `Addr:  ${customer.address}\n`;
  cmds += '-'.repeat(32) + '\n';

  // Group Details
  cmds += `Group: ${book?.name}\n`;
  cmds += `Start: ${book?.startMonthIso}\n`;
  cmds += '-'.repeat(32) + '\n';

  // Financial Summary
  cmds += ESC + 'a' + '\u0001'; // Center
  cmds += 'FINANCIAL SUMMARY\n';
  cmds += ESC + 'a' + '\u0000'; // Left
  const pCount = customer.paymentCount || customer.PAYMENT_COUNT || 0;
  cmds += `Paid (${pCount} mths): RS.${customer.totalPaid}\n`;
  cmds += `Bonus Amount:     RS.${customer.bonusAmount || 0}\n`;
  
  cmds += '-'.repeat(32) + '\n';
  
  // Total
  cmds += ESC + 'a' + '\u0002'; // Right align
  cmds += GS + '!' + '\u0011'; // Double height & width
  cmds += `NET PAYABLE: RS.${totalSettlement}\n`;
  cmds += GS + '!' + '\u0000'; // Normal size
  
  // Footer
  cmds += ESC + 'a' + '\u0001'; // Center align
  cmds += '\n\n';
  cmds += '.'.repeat(15) + '\n';
  cmds += 'Authorized\n';
  cmds += '\n\n\n\n'; // Feed lines
  cmds += GS + 'V' + '\u0000'; // Full cut

  return encoder.encode(cmds);
};

export const printRawUSB = async (data) => {
  try {
    // Request device - Browser will show a popup to pick the TVS printer
    const device = await navigator.usb.requestDevice({ filters: [] });
    
    await device.open();
    
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    // Dynamically find the correct interface and endpoint
    let interfaceNumber = null;
    let endpointNumber = null;

    for (const iface of device.configuration.interfaces) {
      // Look through alternate interfaces for an 'out' endpoint
      const alternate = iface.alternates[0];
      const outEndpoint = alternate.endpoints.find(e => e.direction === 'out');
      if (outEndpoint) {
        interfaceNumber = iface.interfaceNumber;
        endpointNumber = outEndpoint.endpointNumber;
        break;
      }
    }

    if (interfaceNumber === null || endpointNumber === null) {
      throw new Error("No valid printing interface found on this device.");
    }

    await device.claimInterface(interfaceNumber);
    await device.transferOut(endpointNumber, data);
    
    // Clean up
    await device.releaseInterface(interfaceNumber);
    await device.close();
    return true;
  } catch (err) {
    console.error("USB Print Error:", err);
    throw err;
  }
};
