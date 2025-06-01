import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EventService, convertFormDataToEvent } from '../services/eventService';
import { Event, EventFormData } from '../types/event';
import toast from 'react-hot-toast';

// Re-export the original query keys
export { eventKeys } from './useEvents';

// Enhanced hooks with toast notifications

export const useCreateEventWithToast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: EventFormData) => {
      const loadingToast = toast.loading('Creating event...');
      
      try {
        const eventData = convertFormDataToEvent(formData);
        const eventId = await EventService.createEvent(eventData);
        
        toast.success('Event created successfully!', { id: loadingToast });
        return eventId;
      } catch (error) {
        toast.error('Failed to create event. Please try again.', { id: loadingToast });
        throw error;
      }
    },
    onSuccess: (eventId, formData) => {
      // Invalidate and refetch events lists
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      // If organizer email is provided, invalidate organizer events
      if (formData.organizerEmail) {
        queryClient.invalidateQueries({ 
          queryKey: ['events', 'organizer', formData.organizerEmail] 
        });
      }

      // Optimistically add the new event to cache
      const newEvent: Event = {
        id: eventId,
        ...convertFormDataToEvent(formData),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(['events', 'detail', eventId], newEvent);
    },
    onError: (error: unknown) => {
      console.error('Error creating event:', error);
      // Additional error handling can be added here
    },
  });
};

export const useUpdateEventWithToast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: string; updates: Partial<Event> }) => {
      const loadingToast = toast.loading('Updating event...');
      
      try {
        await EventService.updateEvent(eventId, updates);
        toast.success('Event updated successfully!', { id: loadingToast });
        return { eventId, updates };
      } catch (error) {
        toast.error('Failed to update event. Please try again.', { id: loadingToast });
        throw error;
      }
    },
    onMutate: async ({ eventId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['events', 'detail', eventId] });

      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData<Event>(['events', 'detail', eventId]);

      // Optimistically update the cache
      if (previousEvent) {
        const updatedEvent = {
          ...previousEvent,
          ...updates,
          updatedAt: new Date(),
        };
        queryClient.setQueryData(['events', 'detail', eventId], updatedEvent);
      }

      return { previousEvent };
    },
    onError: (error: unknown, { eventId }, context) => {
      // Rollback on error
      if (context?.previousEvent) {
        queryClient.setQueryData(['events', 'detail', eventId], context.previousEvent);
      }
      console.error('Error updating event:', error);
    },
    onSettled: (data) => {
      if (data) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['events', 'detail', data.eventId] });
        queryClient.invalidateQueries({ queryKey: ['events', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['events', 'upcoming'] });
      }
    },
  });
};

export const useDeleteEventWithToast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const loadingToast = toast.loading('Deleting event...');
      
      try {
        await EventService.deleteEvent(eventId);
        toast.success('Event deleted successfully!', { id: loadingToast });
        return eventId;
      } catch (error) {
        toast.error('Failed to delete event. Please try again.', { id: loadingToast });
        throw error;
      }
    },
    onMutate: async (eventId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['events', 'detail', eventId] });

      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData<Event>(['events', 'detail', eventId]);

      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: ['events', 'detail', eventId] });

      return { previousEvent, eventId };
    },
    onError: (error: unknown, eventId, context) => {
      // Rollback on error
      if (context?.previousEvent) {
        queryClient.setQueryData(['events', 'detail', eventId], context.previousEvent);
      }
      console.error('Error deleting event:', error);
    },
    onSuccess: (eventId) => {
      // Invalidate and refetch events lists
      queryClient.invalidateQueries({ queryKey: ['events', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['events', 'upcoming'] });
      
      // Remove the specific event from cache
      queryClient.removeQueries({ queryKey: ['events', 'detail', eventId] });
    },
  });
};

// Enhanced query hook with error handling
export const useEventWithErrorHandling = (eventId: string) => {
  return useQuery({
    queryKey: ['events', 'detail', eventId],
    queryFn: async () => {
      try {
        const event = await EventService.getEventById(eventId);
        if (!event) {
          toast.error('Event not found');
          throw new Error('Event not found');
        }
        return event;
      } catch (error) {
        toast.error('Failed to load event details');
        throw error;
      }
    },
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 errors
      if (error && typeof error === 'object' && 'message' in error && error.message === 'Event not found') {
        return false;
      }
      return failureCount < 3;
    },
  });
};

export const useEventsWithErrorHandling = (options?: {
  isPrivate?: boolean;
  organizerEmail?: string;
  limitCount?: number;
}) => {
  return useQuery({
    queryKey: ['events', 'list', options || {}],
    queryFn: async () => {
      try {
        return await EventService.getAllEvents(options);
      } catch (error) {
        toast.error('Failed to load events');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
  });
}; 