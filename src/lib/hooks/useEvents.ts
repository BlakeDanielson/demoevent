import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EventService, convertFormDataToEvent } from '../services/eventService';
import { Event, EventFormData } from '../types/event';

// Query keys for React Query
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  upcoming: (limit?: number) => [...eventKeys.all, 'upcoming', limit] as const,
  byOrganizer: (email: string) => [...eventKeys.all, 'organizer', email] as const,
  search: (term: string) => [...eventKeys.all, 'search', term] as const,
};

// Hook to get all events with optional filters
export const useEvents = (options?: {
  isPrivate?: boolean;
  organizerEmail?: string;
  limitCount?: number;
}) => {
  return useQuery({
    queryKey: eventKeys.list(options || {}),
    queryFn: () => EventService.getAllEvents(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get a single event by ID
export const useEvent = (eventId: string) => {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => EventService.getEventById(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get upcoming events
export const useUpcomingEvents = (limitCount: number = 10) => {
  return useQuery({
    queryKey: eventKeys.upcoming(limitCount),
    queryFn: () => EventService.getUpcomingEvents(limitCount),
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent updates for upcoming events)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get events by organizer
export const useEventsByOrganizer = (organizerEmail: string) => {
  return useQuery({
    queryKey: eventKeys.byOrganizer(organizerEmail),
    queryFn: () => EventService.getEventsByOrganizer(organizerEmail),
    enabled: !!organizerEmail,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to search events
export const useSearchEvents = (searchTerm: string) => {
  return useQuery({
    queryKey: eventKeys.search(searchTerm),
    queryFn: () => EventService.searchEvents(searchTerm),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to create a new event
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: EventFormData) => {
      const eventData = convertFormDataToEvent(formData);
      return EventService.createEvent(eventData);
    },
    onSuccess: (eventId, formData) => {
      // Invalidate and refetch events lists
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.upcoming() });
      
      // If organizer email is provided, invalidate organizer events
      if (formData.organizerEmail) {
        queryClient.invalidateQueries({ 
          queryKey: eventKeys.byOrganizer(formData.organizerEmail) 
        });
      }

      // Optimistically add the new event to cache
      const newEvent: Event = {
        id: eventId,
        ...convertFormDataToEvent(formData),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(eventKeys.detail(eventId), newEvent);
    },
    onError: (error) => {
      console.error('Failed to create event:', error);
    },
  });
};

// Hook to update an event
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: string; updates: Partial<Event> }) => {
      await EventService.updateEvent(eventId, updates);
      return { eventId, updates };
    },
    onMutate: async ({ eventId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: eventKeys.detail(eventId) });

      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData<Event>(eventKeys.detail(eventId));

      // Optimistically update the cache
      if (previousEvent) {
        const updatedEvent = {
          ...previousEvent,
          ...updates,
          updatedAt: new Date(),
        };
        queryClient.setQueryData(eventKeys.detail(eventId), updatedEvent);
      }

      return { previousEvent };
    },
    onError: (error, { eventId }, context) => {
      // Rollback on error
      if (context?.previousEvent) {
        queryClient.setQueryData(eventKeys.detail(eventId), context.previousEvent);
      }
      console.error('Failed to update event:', error);
    },
    onSettled: (data) => {
      if (data) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: eventKeys.detail(data.eventId) });
        queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
        queryClient.invalidateQueries({ queryKey: eventKeys.upcoming() });
      }
    },
  });
};

// Hook to delete an event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => EventService.deleteEvent(eventId),
    onMutate: async (eventId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: eventKeys.detail(eventId) });

      // Snapshot the previous value
      const previousEvent = queryClient.getQueryData<Event>(eventKeys.detail(eventId));

      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: eventKeys.detail(eventId) });

      return { previousEvent, eventId };
    },
    onError: (error, eventId, context) => {
      // Rollback on error
      if (context?.previousEvent) {
        queryClient.setQueryData(eventKeys.detail(eventId), context.previousEvent);
      }
      console.error('Failed to delete event:', error);
    },
    onSuccess: (_, eventId) => {
      // Invalidate and refetch events lists
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.upcoming() });
      
      // Remove the specific event from cache
      queryClient.removeQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
};

// Hook to prefetch an event (useful for hover states, etc.)
export const usePrefetchEvent = () => {
  const queryClient = useQueryClient();

  return (eventId: string) => {
    queryClient.prefetchQuery({
      queryKey: eventKeys.detail(eventId),
      queryFn: () => EventService.getEventById(eventId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
};

// Hook to invalidate all event queries (useful for manual refresh)
export const useInvalidateEvents = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: eventKeys.all });
  };
}; 