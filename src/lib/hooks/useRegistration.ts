import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  registrationService, 
  registrationFormService, 
  ticketTypeService,
  fileUploadService,
  generateConfirmationCode 
} from '../services/registrationService';
import { 
  Registration, 
  RegistrationFormConfig, 
  TicketType, 
  RegistrationFormData,
  UploadedFile 
} from '../types/registration';
import toast from 'react-hot-toast';

export const useRegistration = (eventId: string) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({});

  // Fetch registration form configuration
  const {
    data: formConfig,
    isLoading: isLoadingFormConfig,
    error: formConfigError,
  } = useQuery({
    queryKey: ['registrationForm', eventId],
    queryFn: () => registrationFormService.getFormConfigByEventId(eventId),
    enabled: !!eventId,
  });

  // Fetch ticket types
  const {
    data: ticketTypes,
    isLoading: isLoadingTicketTypes,
    error: ticketTypesError,
  } = useQuery({
    queryKey: ['ticketTypes', eventId],
    queryFn: () => ticketTypeService.getEventTicketTypes(eventId),
    enabled: !!eventId,
  });

  // Fetch registrations for the event
  const {
    data: registrations,
    isLoading: isLoadingRegistrations,
    error: registrationsError,
  } = useQuery({
    queryKey: ['registrations', eventId],
    queryFn: () => registrationService.getEventRegistrations(eventId),
    enabled: !!eventId,
  });

  // Fetch registration summary
  const {
    data: registrationSummary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useQuery({
    queryKey: ['registrationSummary', eventId],
    queryFn: () => registrationService.getRegistrationSummary(eventId),
    enabled: !!eventId,
  });

  // File upload mutation
  const fileUploadMutation = useMutation({
    mutationFn: ({ file, fieldId }: { file: File; fieldId: string }) =>
      fileUploadService.uploadFile(file, eventId, fieldId),
    onSuccess: (uploadedFile, { fieldId }) => {
      setUploadedFiles(prev => ({
        ...prev,
        [fieldId]: [...(prev[fieldId] || []), uploadedFile],
      }));
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    },
  });

  // Registration submission mutation
  const submitRegistrationMutation = useMutation({
    mutationFn: async (formData: RegistrationFormData) => {
      if (!formConfig) {
        throw new Error('Registration form configuration not found');
      }

      // Validate ticket availability
      for (const selection of formData.ticketSelections) {
        const ticketType = ticketTypes?.find(t => t.id === selection.ticketTypeId);
        if (!ticketType) {
          throw new Error(`Ticket type not found: ${selection.ticketTypeId}`);
        }
        if (ticketType.availableQuantity < selection.quantity) {
          throw new Error(`Insufficient tickets available for ${ticketType.name}`);
        }
      }

      // Calculate total amount
      const totalAmount = formData.ticketSelections.reduce((sum, selection) => {
        const ticketType = ticketTypes?.find(t => t.id === selection.ticketTypeId);
        return sum + (ticketType ? ticketType.price * selection.quantity : 0);
      }, 0);

      // Create registration data
      const registrationData: Omit<Registration, 'id' | 'createdAt' | 'updatedAt'> = {
        eventId,
        formConfigId: formConfig.id,
        primaryParticipant: {
          id: crypto.randomUUID(),
          ...formData.primaryParticipant,
          uploadedFiles: uploadedFiles[`primary`] || [],
        },
        additionalParticipants: formData.additionalParticipants.map((participant, index) => ({
          id: crypto.randomUUID(),
          ...participant,
          uploadedFiles: uploadedFiles[`additional_${index}`] || [],
        })),
        ticketSelections: formData.ticketSelections,
        totalAmount,
        status: formConfig.requiresApproval ? 'pending' : 'confirmed',
        paymentStatus: totalAmount === 0 ? 'completed' : 'pending',
        registrationDate: new Date(),
        confirmationCode: generateConfirmationCode(),
      };

      // Create the registration
      const registrationId = await registrationService.createRegistration(registrationData);

      // Update ticket availability
      for (const selection of formData.ticketSelections) {
        await ticketTypeService.updateTicketAvailability(
          selection.ticketTypeId,
          -selection.quantity
        );
      }

      return { registrationId, confirmationCode: registrationData.confirmationCode };
    },
    onSuccess: (result) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['registrations', eventId] });
      queryClient.invalidateQueries({ queryKey: ['registrationSummary', eventId] });
      queryClient.invalidateQueries({ queryKey: ['ticketTypes', eventId] });
      
      toast.success(`Registration successful! Confirmation code: ${result.confirmationCode}`);
      
      // Clear uploaded files
      setUploadedFiles({});
    },
    onError: (error) => {
      console.error('Registration submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit registration');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Update registration status mutation
  const updateRegistrationStatusMutation = useMutation({
    mutationFn: ({ 
      registrationId, 
      status, 
      paymentStatus 
    }: { 
      registrationId: string; 
      status: Registration['status']; 
      paymentStatus?: Registration['paymentStatus'] 
    }) =>
      registrationService.updateRegistrationStatus(registrationId, status, paymentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations', eventId] });
      queryClient.invalidateQueries({ queryKey: ['registrationSummary', eventId] });
      toast.success('Registration status updated successfully');
    },
    onError: (error) => {
      console.error('Status update error:', error);
      toast.error('Failed to update registration status');
    },
  });

  // Submit registration
  const submitRegistration = useCallback(async (formData: RegistrationFormData) => {
    setIsSubmitting(true);
    return submitRegistrationMutation.mutateAsync(formData);
  }, [submitRegistrationMutation]);

  // Upload file
  const uploadFile = useCallback((file: File, fieldId: string) => {
    return fileUploadMutation.mutateAsync({ file, fieldId });
  }, [fileUploadMutation]);

  // Remove uploaded file
  const removeUploadedFile = useCallback((fieldId: string, fileIndex: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fieldId]: prev[fieldId]?.filter((_, index) => index !== fileIndex) || [],
    }));
  }, []);

  // Update registration status
  const updateRegistrationStatus = useCallback((
    registrationId: string, 
    status: Registration['status'], 
    paymentStatus?: Registration['paymentStatus']
  ) => {
    return updateRegistrationStatusMutation.mutateAsync({ 
      registrationId, 
      status, 
      paymentStatus 
    });
  }, [updateRegistrationStatusMutation]);

  // Calculate available tickets for a ticket type
  const getAvailableTickets = useCallback((ticketTypeId: string): number => {
    const ticketType = ticketTypes?.find(t => t.id === ticketTypeId);
    return ticketType?.availableQuantity || 0;
  }, [ticketTypes]);

  // Check if registration is open
  const isRegistrationOpen = useCallback((): boolean => {
    if (!formConfig || !formConfig.isActive) return false;
    
    const now = new Date();
    const hasAvailableTickets = ticketTypes?.some(ticket => 
      ticket.isActive && 
      ticket.availableQuantity > 0 &&
      (!ticket.salesStartDate || ticket.salesStartDate <= now) &&
      (!ticket.salesEndDate || ticket.salesEndDate >= now)
    );
    
    return hasAvailableTickets || false;
  }, [formConfig, ticketTypes]);

  return {
    // Data
    formConfig,
    ticketTypes,
    registrations,
    registrationSummary,
    uploadedFiles,
    
    // Loading states
    isLoadingFormConfig,
    isLoadingTicketTypes,
    isLoadingRegistrations,
    isLoadingSummary,
    isSubmitting,
    
    // Error states
    formConfigError,
    ticketTypesError,
    registrationsError,
    summaryError,
    
    // Actions
    submitRegistration,
    uploadFile,
    removeUploadedFile,
    updateRegistrationStatus,
    
    // Utilities
    getAvailableTickets,
    isRegistrationOpen,
    
    // Mutation states
    isUploadingFile: fileUploadMutation.isPending,
    isUpdatingStatus: updateRegistrationStatusMutation.isPending,
  };
}; 