import React from 'react';

const BulkPaymentReceipt = ({ payments, customer, book }) => {
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="font-sans text-sm text-gray-800 bg-white p-6 print:p-0">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">{import.meta.env.VITE_COMPANY_NAME}</h1>
        <p className="text-xs">{import.meta.env.VITE_COMPANY_ADDRESS}</p>
        <p className="text-xs">
          Cell: {import.meta.env.VITE_COMPANY_CELL} | Phone: {import.meta.env.VITE_COMPANY_PHONE}
        </p>
      </div>

      {/* Customer Details */}
      <div className="mb-4 border-t border-b border-gray-300 py-2">
        <div className="flex justify-between">
          <span><strong>Group/Book:</strong> {book?.name}</span>
          <span><strong>Customer:</strong> {customer?.name}</span>
          <span><strong>Phone:</strong> {customer?.phone}</span>
        </div>
      </div>

      {/* Payments Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="py-2 pr-2">Receipt No.</th>
            <th className="py-2 pr-2">Payment Date</th>
            <th className="py-2 pr-2">For Month</th>
            <th className="py-2 pr-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(payment => (
            <tr key={payment.id} className="border-b border-gray-200">
              <td className="py-2 pr-2">{payment.receiptNo}</td>
              <td className="py-2 pr-2">{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</td>
              <td className="py-2 pr-2">{payment.monthIso}</td>
              <td className="py-2 pr-2 text-right">₹ {Number(payment.amount).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-bold">
            <td colSpan="3" className="py-2 text-right">Total Amount:</td>
            <td className="py-2 text-right">₹ {totalAmount.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-16 text-center text-xs text-gray-500">
        <p>--- Thank you for your payment ---</p>
      </div>
    </div>
  );
};

export default BulkPaymentReceipt;
