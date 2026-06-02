import React from 'react';

const BulkPaymentReceipt = ({ payments, customer, book, user }) => {
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return (
    <div className="font-sans text-[12px] text-black bg-white p-2 mx-auto w-[72mm] print:m-0 print:p-0 print:w-[72mm] print:overflow-hidden">
      <style>
        {`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
            }
            * {
              box-shadow: none !important;
              text-shadow: none !important;
            }
          }
        `}
      </style>
      {/* Header */}
      <div className="text-center mb-3 border-b-2 border-black pb-2">
        <h1 className="text-[18px] font-bold uppercase leading-tight">{user?.company_name || 'Your Company'}</h1>
        <p className="text-[10px] leading-tight mt-1">{user?.company_address || 'Your Company Address'}</p>
        {(user?.company_cell || user?.company_phone) && (
          <p className="text-[10px] font-semibold mt-1">
            Contacts: {[user.company_cell, user.company_phone].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {/* Info Section */}
      <div className="mb-3 leading-relaxed">
        <div className="flex justify-between">
          <span><strong>Group:</strong> {book?.name}</span>
          <span><strong>Start Month:</strong> {book?.startMonthIso}</span>
        </div>
        <div><strong>Cust ID:</strong> {customer?.id}</div>
        <div><strong>Ph:</strong> {customer?.phone}</div>
        <div><strong>Cust name:</strong> {customer?.name}</div>
      </div>

      <div className="border-b border-black mb-3"></div> {/* Horizontal line */}

      {/* Payments Table */}
      <table className="w-full text-left border-collapse table-fixed">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1 w-[65%]">Payment Details</th>
            <th className="py-1 w-[35%] text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(payment => (
            <tr key={payment.id} className="border-b border-black">
              <td className="py-2 align-top">
                <div className="text-[12px] font-semibold">Receipt No: {payment.receiptNo}</div>
                <div className="text-[10px] text-black">
                  Agent: {payment.agentName} <br />
                  Date: {new Date(payment.paymentDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })} <br />
                  Month: {payment.monthIso}
                </div>
              </td>
              <td className="py-2 align-top text-right">
                <div className="font-semibold text-[14px]">₹{Number(payment.amount).toLocaleString('en-IN')}</div>
                <div className="text-[9px] text-black uppercase mt-0.5">
                  {Number(payment.amountCash) > 0 && <div>Cash: {payment.amountCash}</div>}
                  {Number(payment.amountOnline) > 0 && <div>Online: {payment.amountOnline}</div>}
                  {Number(payment.amountInstore) > 0 && <div>Store: {payment.amountInstore}</div>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold text-[14px]">
            <td className="py-3 text-right">Grand Total:</td>
            <td className="py-3 text-right border-t-2 border-black">₹{totalAmount.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-6 text-center text-[10px] italic border-t border-dotted border-black pt-2">
        <p>This is a computer generated receipt.</p>
        <p className="mt-1">--- Thank you ---</p>
      </div>
    </div>
  );
};

export default BulkPaymentReceipt;
