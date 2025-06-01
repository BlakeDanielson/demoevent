'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Users, 
  CreditCard, 
  Upload, 
  Plus, 
  Minus, 
  Check, 
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  FileText,
  X
} from 'lucide-react';
import { useRegistration } from '../lib/hooks/useRegistration';
import { 
  CustomField, 
  TicketType, 
  RegistrationFormData 
} from '../lib/types/registration';
import { 
  registrationFormSchema, 
  createCustomFieldValidation 
} from '../lib/validations/registration';
import { LoadingSpinner } from './LoadingSpinner';
import { Skeleton } from './LoadingSkeleton';
import toast from 'react-hot-toast';

interface RegistrationFormProps {
  eventId: string;
  onSuccess?: (confirmationCode: string) => void;
}

interface CustomFieldInputProps {
  field: CustomField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  onFileUpload?: (file: File) => Promise<void>;
  uploadedFiles?: any[];
  onRemoveFile?: (index: number) => void;
  isUploading?: boolean;
}

const CustomFieldInput: React.FC<CustomFieldInputProps> = ({
  field,
  value,
  onChange,
  error,
  onFileUpload,
  uploadedFiles = [],
  onRemoveFile,
  isUploading = false,
}) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      // Validate file type
      if (field.validation?.fileTypes && field.validation.fileTypes.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!field.validation.fileTypes.includes(`.${fileExtension}`)) {
          toast.error(`Invalid file type. Allowed types: ${field.validation.fileTypes.join(', ')}`);
          return;
        }
      }
      
      // Validate file size
      if (field.validation?.maxFileSize && file.size > field.validation.maxFileSize) {
        const maxSizeMB = (field.validation.maxFileSize / (1024 * 1024)).toFixed(1);
        toast.error(`File size too large. Maximum size: ${maxSizeMB}MB`);
        return;
      }
      
      await onFileUpload(file);
    }
  };

  const baseInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const errorClasses = error ? "border-red-500 focus:ring-red-500" : "";

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <div>
          <input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case 'textarea':
      return (
        <div>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`${baseInputClasses} ${errorClasses} resize-vertical`}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} ${errorClasses}`}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case 'checkbox':
      return (
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </label>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case 'date':
      return (
        <div>
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    case 'file':
      return (
        <div>
          <div className="space-y-2">
            <input
              type="file"
              onChange={handleFileChange}
              accept={field.validation?.fileTypes?.join(',')}
              className="hidden"
              id={`file-${field.id}`}
              disabled={isUploading}
            />
            <label
              htmlFor={`file-${field.id}`}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isUploading ? 'Uploading...' : 'Choose File'}
            </label>
            
            {field.validation?.fileTypes && (
              <p className="text-xs text-gray-500">
                Allowed types: {field.validation.fileTypes.join(', ')}
              </p>
            )}
            
            {field.validation?.maxFileSize && (
              <p className="text-xs text-gray-500">
                Max size: {(field.validation.maxFileSize / (1024 * 1024)).toFixed(1)}MB
              </p>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-2 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-700">{file.fileName}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveFile?.(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );

    default:
      return null;
  }
};

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  eventId,
  onSuccess,
}) => {
  const {
    formConfig,
    ticketTypes,
    isLoadingFormConfig,
    isLoadingTicketTypes,
    formConfigError,
    ticketTypesError,
    submitRegistration,
    uploadFile,
    removeUploadedFile,
    uploadedFiles,
    isSubmitting,
    isUploadingFile,
    getAvailableTickets,
    isRegistrationOpen,
  } = useRegistration(eventId);

  const [currentStep, setCurrentStep] = useState(0);
  const [showGroupRegistration, setShowGroupRegistration] = useState(false);

  // Create dynamic schema based on form configuration
  const createDynamicSchema = () => {
    if (!formConfig) return registrationFormSchema;

    const customFieldValidations: Record<string, z.ZodType<any>> = {};
    
    formConfig.customFields.forEach(field => {
      customFieldValidations[field.name] = createCustomFieldValidation(field);
    });

    const participantSchemaWithCustomFields = z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      email: z.string().email('Invalid email address'),
      phone: z.string().optional(),
      customFieldValues: z.object(customFieldValidations),
    });

    return z.object({
      primaryParticipant: participantSchemaWithCustomFields,
      additionalParticipants: z.array(participantSchemaWithCustomFields),
      ticketSelections: z.array(z.object({
        ticketTypeId: z.string().min(1, 'Ticket type is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        price: z.number().min(0, 'Price must be non-negative'),
      })).min(1, 'At least one ticket must be selected'),
      agreeToTerms: z.boolean().refine(val => val === true, {
        message: 'You must agree to the terms and conditions',
      }),
      marketingOptIn: z.boolean().optional(),
    });
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(createDynamicSchema()),
    defaultValues: {
      primaryParticipant: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        customFieldValues: {},
      },
      additionalParticipants: [],
      ticketSelections: [],
      agreeToTerms: false,
      marketingOptIn: false,
    },
  });

  const { fields: additionalParticipants, append: addParticipant, remove: removeParticipant } = useFieldArray({
    control,
    name: 'additionalParticipants',
  });

  const { fields: ticketSelections, append: addTicketSelection, remove: removeTicketSelection } = useFieldArray({
    control,
    name: 'ticketSelections',
  });

  const watchedTicketSelections = watch('ticketSelections');
  const watchedAdditionalParticipants = watch('additionalParticipants');

  // Calculate total amount
  const totalAmount = watchedTicketSelections.reduce((sum, selection) => {
    const ticketType = ticketTypes?.find(t => t.id === selection.ticketTypeId);
    return sum + (ticketType ? ticketType.price * (selection.quantity || 0) : 0);
  }, 0);

  // Handle file upload
  const handleFileUpload = async (file: File, fieldId: string) => {
    try {
      await uploadFile(file, fieldId);
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  // Handle form submission
  const onSubmit = async (data: RegistrationFormData) => {
    try {
      const result = await submitRegistration(data);
      onSuccess?.(result.confirmationCode);
      reset();
      setCurrentStep(0);
      setShowGroupRegistration(false);
    } catch (error) {
      console.error('Registration submission failed:', error);
    }
  };

  // Loading states
  if (isLoadingFormConfig || isLoadingTicketTypes) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Error states
  if (formConfigError || ticketTypesError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Registration Form
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {formConfigError?.message || ticketTypesError?.message || 'An unexpected error occurred'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No form configuration
  if (!formConfig) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Registration Not Available
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                Registration is not currently available for this event.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration closed
  if (!isRegistrationOpen()) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-gray-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">
                Registration Closed
              </h3>
              <div className="mt-2 text-sm text-gray-700">
                Registration for this event is currently closed or all tickets are sold out.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { title: 'Participant Information', icon: User },
    { title: 'Ticket Selection', icon: CreditCard },
    { title: 'Review & Submit', icon: Check },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{formConfig.title}</h1>
        {formConfig.description && (
          <p className="text-gray-600">{formConfig.description}</p>
        )}
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : isCompleted 
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-0.5 w-16 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Participant Information */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Primary Participant
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <Controller
                    name="primaryParticipant.firstName"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.primaryParticipant?.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.primaryParticipant.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <Controller
                    name="primaryParticipant.lastName"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.primaryParticipant?.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.primaryParticipant.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Controller
                    name="primaryParticipant.email"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.primaryParticipant?.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.primaryParticipant.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Controller
                    name="primaryParticipant.phone"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.primaryParticipant?.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.primaryParticipant.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Custom Fields */}
              {formConfig.customFields.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formConfig.customFields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label} {field.required && '*'}
                          </label>
                          <Controller
                            name={`primaryParticipant.customFieldValues.${field.name}` as any}
                            control={control}
                            render={({ field: formField }) => (
                              <CustomFieldInput
                                field={field}
                                value={formField.value}
                                onChange={formField.onChange}
                                error={errors.primaryParticipant?.customFieldValues?.[field.name]?.message as string}
                                onFileUpload={(file) => handleFileUpload(file, `primary_${field.id}`)}
                                uploadedFiles={uploadedFiles[`primary_${field.id}`] || []}
                                onRemoveFile={(index) => removeUploadedFile(`primary_${field.id}`, index)}
                                isUploading={isUploadingFile}
                              />
                            )}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Group Registration */}
            {formConfig.allowGroupRegistration && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Group Registration
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowGroupRegistration(!showGroupRegistration)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {showGroupRegistration ? 'Hide' : 'Add Additional Participants'}
                  </button>
                </div>

                {showGroupRegistration && (
                  <div className="space-y-4">
                    {additionalParticipants.map((participant, index) => (
                      <div key={participant.id} className="p-4 border border-gray-200 rounded-md">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Participant {index + 2}
                          </h3>
                          <button
                            type="button"
                            onClick={() => removeParticipant(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              First Name *
                            </label>
                            <Controller
                              name={`additionalParticipants.${index}.firstName`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="text"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name *
                            </label>
                            <Controller
                              name={`additionalParticipants.${index}.lastName`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="text"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email *
                            </label>
                            <Controller
                              name={`additionalParticipants.${index}.email`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="email"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              )}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone
                            </label>
                            <Controller
                              name={`additionalParticipants.${index}.phone`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  {...field}
                                  type="tel"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              )}
                            />
                          </div>
                        </div>

                        {/* Custom fields for additional participants */}
                        {formConfig.customFields.length > 0 && (
                          <div className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {formConfig.customFields
                                .sort((a, b) => a.order - b.order)
                                .map((field) => (
                                  <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      {field.label} {field.required && '*'}
                                    </label>
                                    <Controller
                                      name={`additionalParticipants.${index}.customFieldValues.${field.name}` as any}
                                      control={control}
                                      render={({ field: formField }) => (
                                        <CustomFieldInput
                                          field={field}
                                          value={formField.value}
                                          onChange={formField.onChange}
                                          onFileUpload={(file) => handleFileUpload(file, `additional_${index}_${field.id}`)}
                                          uploadedFiles={uploadedFiles[`additional_${index}_${field.id}`] || []}
                                          onRemoveFile={(fileIndex) => removeUploadedFile(`additional_${index}_${field.id}`, fileIndex)}
                                          isUploading={isUploadingFile}
                                        />
                                      )}
                                    />
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {(!formConfig.maxGroupSize || additionalParticipants.length < formConfig.maxGroupSize - 1) && (
                      <button
                        type="button"
                        onClick={() => addParticipant({
                          firstName: '',
                          lastName: '',
                          email: '',
                          phone: '',
                          customFieldValues: {},
                        })}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Participant
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next: Select Tickets
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Ticket Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Select Tickets
              </h2>

              {ticketTypes && ticketTypes.length > 0 ? (
                <div className="space-y-4">
                  {ticketTypes.map((ticketType) => {
                    const availableQuantity = getAvailableTickets(ticketType.id);
                    const isAvailable = availableQuantity > 0;
                    
                    return (
                      <div key={ticketType.id} className={`p-4 border rounded-md ${
                        isAvailable ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{ticketType.name}</h3>
                            {ticketType.description && (
                              <p className="text-sm text-gray-600 mt-1">{ticketType.description}</p>
                            )}
                            <div className="flex items-center mt-2 space-x-4">
                              <span className="text-lg font-semibold text-gray-900">
                                {ticketType.price === 0 ? 'Free' : `$${ticketType.price.toFixed(2)}`}
                              </span>
                              <span className={`text-sm ${
                                isAvailable ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {isAvailable 
                                  ? `${availableQuantity} available` 
                                  : 'Sold out'
                                }
                              </span>
                            </div>
                          </div>

                          {isAvailable && (
                            <div className="flex items-center space-x-2">
                              <label className="text-sm font-medium text-gray-700">Quantity:</label>
                              <select
                                onChange={(e) => {
                                  const quantity = parseInt(e.target.value);
                                  const existingIndex = ticketSelections.findIndex(
                                    s => s.ticketTypeId === ticketType.id
                                  );
                                  
                                  if (quantity === 0) {
                                    if (existingIndex >= 0) {
                                      removeTicketSelection(existingIndex);
                                    }
                                  } else {
                                    if (existingIndex >= 0) {
                                      setValue(`ticketSelections.${existingIndex}.quantity`, quantity);
                                    } else {
                                      addTicketSelection({
                                        ticketTypeId: ticketType.id,
                                        quantity,
                                        price: ticketType.price,
                                      });
                                    }
                                  }
                                }}
                                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                defaultValue={0}
                              >
                                {Array.from({ length: Math.min(availableQuantity, 10) + 1 }, (_, i) => (
                                  <option key={i} value={i}>{i}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600">No tickets available for this event.</p>
              )}

              {ticketSelections.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Order Summary</h3>
                  <div className="space-y-2">
                    {watchedTicketSelections.map((selection, index) => {
                      const ticketType = ticketTypes?.find(t => t.id === selection.ticketTypeId);
                      if (!ticketType) return null;
                      
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{ticketType.name} × {selection.quantity}</span>
                          <span>${(ticketType.price * selection.quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {errors.ticketSelections && (
                <p className="mt-2 text-sm text-red-600">{errors.ticketSelections.message}</p>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={ticketSelections.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review Order
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Check className="w-5 h-5 mr-2" />
                Review & Submit
              </h2>

              {/* Order Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="space-y-2">
                    {watchedTicketSelections.map((selection, index) => {
                      const ticketType = ticketTypes?.find(t => t.id === selection.ticketTypeId);
                      if (!ticketType) return null;
                      
                      return (
                        <div key={index} className="flex justify-between">
                          <span>{ticketType.name} × {selection.quantity}</span>
                          <span>${(ticketType.price * selection.quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Participants</h3>
                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Primary:</strong> {watch('primaryParticipant.firstName')} {watch('primaryParticipant.lastName')} ({watch('primaryParticipant.email')})
                  </div>
                  {watchedAdditionalParticipants.map((participant, index) => (
                    <div key={index} className="text-sm">
                      <strong>Participant {index + 2}:</strong> {participant.firstName} {participant.lastName} ({participant.email})
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-6">
                <Controller
                  name="agreeToTerms"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the terms and conditions and understand that this registration is binding. *
                      </span>
                    </label>
                  )}
                />
                {errors.agreeToTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms.message}</p>
                )}
              </div>

              {/* Marketing Opt-in */}
              <div className="mb-6">
                <Controller
                  name="marketingOptIn"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={field.value || false}
                        onChange={field.onChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        I would like to receive updates and promotional emails about future events.
                      </span>
                    </label>
                  )}
                />
              </div>

              {formConfig.confirmationMessage && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">{formConfig.confirmationMessage}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Registration'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}; 