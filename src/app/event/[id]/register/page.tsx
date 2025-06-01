'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RegistrationForm } from '../../../../components/RegistrationForm';
import { Check, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  const handleRegistrationSuccess = (code: string) => {
    setConfirmationCode(code);
    setRegistrationComplete(true);
  };

  const handleBackToEvent = () => {
    router.push(`/event/${eventId}`);
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Registration Successful!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Thank you for registering. Your registration has been submitted successfully.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your confirmation code:</p>
              <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                {confirmationCode}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Please save this code for your records
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                A confirmation email has been sent to your registered email address with all the details.
              </p>
              
              <button
                onClick={handleBackToEvent}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Event Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBackToEvent}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event Details
          </button>
        </div>
        
        <RegistrationForm 
          eventId={eventId} 
          onSuccess={handleRegistrationSuccess}
        />
      </div>
    </div>
  );
} 