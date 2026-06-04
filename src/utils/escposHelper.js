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
  cmds += `RECEIPT NO: ${payment.receiptNo || payment.receipt_no || payment.RECEIPT_NO || 'N/A'}\n`;
  cmds += ESC + 'E' + '\u0000'; // Bold OFF
  const pDate = payment.paymentDate || payment.payment_date || payment.PAYMENT_DATE || new Date();
  cmds += `Date:  ${new Date(pDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}\n`;
  cmds += `Month: ${payment.monthIso || payment.month_iso || 'N/A'}\n`;
  cmds += `Agent: ${payment.agentName || payment.agent_name || 'N/A'}\n`;
  
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

export const generateSettlementEscPos = (customer, book, user, isDuplicate = false) => {
  const encoder = new TextEncoder();
  let cmds = '';
  const bonusAmount = customer.bonusAmount || customer.bonus_amount || 0;
  const settledDate = customer.settledDate || customer.settled_date;
  const settlementReceiptNo = customer.settlementReceiptNo || customer.settlement_receipt_no;
  const settlementAgentName = customer.settlementAgentName || customer.settlement_agent_name;

  const totalSettlement = Number(customer.totalPaid || 0) + Number(bonusAmount);

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
  if (isDuplicate) {
    cmds += ESC + 'E' + '\u0001'; // Bold ON
    cmds += '*** DUPLICATE ***\n';
    cmds += ESC + 'E' + '\u0000'; // Bold OFF
  }
  cmds += GS + '!' + '\u0000'; // Normal size
  cmds += ESC + 'a' + '\u0000'; // Left align
  
  cmds += `Rec No: ${settlementReceiptNo || 'N/A'}\n`;
  cmds += `Date:   ${new Date(settledDate || Date.now()).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}\n`;
  cmds += `Agent:  ${settlementAgentName || 'N/A'}\n`;
  
  cmds += '\n' + ESC + 'a' + '\u0001'; // Center
  cmds += ESC + 'E' + '\u0001'; // Bold
  cmds += customer.isWinner ? 'STATUS: PRIZE COLLECTED\n' : 'STATUS: ACCOUNT SETTLED\n';
  cmds += ESC + 'E' + '\u0000'; // Bold OFF
  cmds += ESC + 'a' + '\u0000'; // Left align
  cmds += '-'.repeat(32) + '\n';

  // Customer Details
  cmds += `Cust:  ${customer.name}\n`;
  cmds += `Cust ID: ${customer.id || ''}\n`;
  cmds += `Phone:   ${customer.phone || ''}\n`;
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
  cmds += `Bonus Amount:     RS.${bonusAmount}\n`;
  
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

  // Add a small buffer of null bytes to ensure the cut command is processed
  const finalData = encoder.encode(cmds + '\u0000\u0000\u0000');
  return finalData;
};

export const printRawUSB = async (data) => {
  try {
    // Always request device to ensure the user picks the correct printer.
    // This avoids accidentally trying to open a mouse or other non-printer USB device.
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
    const result = await device.transferOut(endpointNumber, data);
    
    if (result.status !== 'ok') {
      throw new Error(`Print failed with status: ${result.status}`);
    }

    // Clean up
    await device.releaseInterface(interfaceNumber);
    await device.close();
    return true;
  } catch (err) {
    if (err.name === 'SecurityError' || err.message.includes('Access denied')) {
      throw new Error("USB Access Denied: Another application (like Windows Print Spooler) is using the printer. Please close other apps or update the driver to WinUSB using Zadig.");
    }
    console.error("USB Error:", err);
    throw err;
  }
};

export const printRawNetwork = async (data, token, printerIp) => {
  try {
    const ipToUse = printerIp || localStorage.getItem('printerIpAddress') || '192.168.1.16';
    // Efficient conversion for network transmission
    const base64Data = btoa(Array.from(data).map(b => String.fromCharCode(b)).join(''));

    const response = await fetch(`/api/print/network`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ printerIp: ipToUse, rawData: base64Data })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Network print failed');
    }
    return true;
  } catch (err) {
    console.error("Network Print Error:", err);
    throw err;
  }
};

export const printRawBluetooth = async (data) => {
  try {
    if (!navigator.bluetooth) {
      throw new Error("Bluetooth is not supported in this browser. Use Chrome or Edge.");
    }

    // Use acceptAllDevices to ensure the chooser shows all hardware. 
    // Some printers don't advertise standard POS UUIDs.
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', 
        '00001101-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2'
      ]
    });

    let server;
    let attempts = 0;

    while (attempts < 3) {
      try {
        attempts++;
        console.log(`Bluetooth: Connection attempt ${attempts}/3...`);
        server = await device.gatt.connect();
        
        // Increased stabilization delay for finicky printer firmware
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (!server.connected) throw new Error("GATT Server disconnected after handshake");

        console.log("Bluetooth: Discovering primary services...");
        const services = await server.getPrimaryServices();
        let writeChar = null;
        
        for (const service of services) {
          const chars = await service.getCharacteristics().catch(() => []);
          writeChar = chars.find(c => c.properties.write || c.properties.writeWithoutResponse);
          if (writeChar) break;
        }

        if (!writeChar) throw new Error("No writable characteristic found");

        console.log("Bluetooth: Transmitting print data...");
        // BLE usually has a 20-byte MTU limit.
        const chunkSize = 20;
        for (let i = 0; i < data.length; i += chunkSize) {
          if (!server.connected) throw new Error("GATT Server disconnected during data transfer");
          
          const chunk = data.slice(i, i + chunkSize);
          // Prefer writeValueWithoutResponse for significantly better stability and speed
          if (writeChar.properties.writeWithoutResponse) {
            await writeChar.writeValueWithoutResponse(chunk);
          } else {
            await writeChar.writeValue(chunk);
          }
          // Further increased delay between chunks to prevent buffer congestion
          await new Promise(resolve => setTimeout(resolve, 50)); 
        }

        console.log("Bluetooth: Print job delivered.");
        if (server.connected) server.disconnect();
        return true;
      } catch (err) {
        console.warn(`Bluetooth Attempt ${attempts} failed:`, err.message);
        if (server && server.connected) server.disconnect();
        if (attempts >= 3) throw err;
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return true;
  } catch (err) {
    if (err.name === 'NotFoundError') {
      throw new Error("Bluetooth print cancelled: No device was selected from the list.");
    }
    console.error("Bluetooth Error:", err);
    throw err;
  }
};
