import React from 'react';
import { Typography } from '@mui/material';

const AuthLayout = ({ children, branding }) => {
  return (
    <div className="flex flex-wrap min-h-screen">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center bg-slate-100 p-6 sm:p-12">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-12 text-white">
        <div className="text-center">
          <Typography variant="h3" component="h2" className="!font-bold !mb-4">
            {branding.title}
          </Typography>
          <Typography variant="h6">
            {branding.description}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
