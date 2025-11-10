import React from 'react';

const PaymentReceipt = ({ payment, customer, book, user }) => {
  const details = [
    { label: 'Group', value: book?.name || 'N/A' },
    { label: 'Name', value: `${customer?.name || 'N/A'}` },
    { label: 'Phone', value: customer?.phone || 'N/A' },
    { label: 'For Month', value: payment.monthIso },
  ];

  return (
    // The print:w-[90mm] and print:mx-auto classes handle the print layout.
    // The font-sans and text-sm classes set the base font styles.
    <div className="font-sans text-sm text-gray-800 bg-white p-4 border border-black print:w-[90mm] print:mx-auto print:my-5">
        <div className="text-right text-xs leading-snug">
          <span className='mx-2'>Cell: {user?.company_cell || 'N/A'}</span>
          <span>Phone: {user?.company_phone || 'N/A'}</span>
        </div>

        <h1 className="text-center text-xl font-bold mt-1">{user?.company_name || 'Your Company'}</h1>
        <p className="text-center text-xs mb-4">{user?.company_address || 'Your Company Address'}</p>

        <div className="flex justify-between pb-2 mb-2 border-b border-dashed border-gray-300">
          <span className="text-left">No: {payment.receiptNo}</span>
          <span className="text-right">Date: {new Date(payment.paymentDate).toLocaleDateString('en-IN')}</span>
        </div>

        {details.map((detail) => (
          <div key={detail.label} className="flex justify-between pb-2 mb-2 border-b border-dashed border-gray-300">
            <span className="font-semibold text-gray-600">{detail.label}:</span> <span className="text-right">{detail.value}</span>
          </div>
        ))}
        <div className="flex justify-between text-lg font-bold">
          <span className="font-semibold text-gray-600">Amount Paid:</span> <span className="text-right">₹ {Number(payment.amount).toLocaleString('en-IN')}</span>
        </div>
    </div>
  );
};

export default PaymentReceipt;
