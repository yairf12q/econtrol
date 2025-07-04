import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase, Client } from '@/lib/supabase';

export interface CalendarEvent {
  id: string;
  date: string;
  clientId?: string;
  clientName?: string;
  hours: number;
  description: string;
  startTime?: string;
  endTime?: string;
  type: 'session' | 'meeting' | 'task' | 'other';
  created_at?: string;
  updated_at?: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load clients and calendar events from both localStorage and Supabase
  const loadClients = async () => {
    try {
      setLoading(true);
      
      // Load clients from localStorage first (for immediate display)
      const savedClients = localStorage.getItem('timeTrackingClients');
      let parsedClients: Client[] = [];
      if (savedClients) {
        parsedClients = JSON.parse(savedClients);
        setClients(parsedClients);
        console.log('Loaded clients from localStorage:', parsedClients);
      }

      // Load calendar events from localStorage
      const savedEvents = localStorage.getItem('timeTrackingEvents');
      let parsedEvents: CalendarEvent[] = [];
      if (savedEvents) {
        parsedEvents = JSON.parse(savedEvents);
        setCalendarEvents(parsedEvents);
        console.log('Loaded calendar events from localStorage:', parsedEvents);
      }

      // Then sync with Supabase
      let supabaseClients = null;
      let supabaseEvents = null;
      let clientsError = null;
      let eventsError = null;

      try {
        console.log('Attempting to connect to Supabase...');
        const clientsResult = await supabase
        .from('clients')
        .select('*')
          .order('created_at', { ascending: false });
        
        console.log('Supabase clients result:', clientsResult);
        supabaseClients = clientsResult.data;
        clientsError = clientsResult.error;
        
        if (clientsError) {
          console.error('Supabase clients error:', clientsError);
        }
      } catch (error) {
        console.error('Error querying clients table:', error);
        clientsError = error;
      }

      try {
        const eventsResult = await supabase
          .from('calendar_events')
          .select('*')
          .order('date', { ascending: false });
        
        console.log('Supabase events result:', eventsResult);
        supabaseEvents = eventsResult.data;
        eventsError = eventsResult.error;
        
        if (eventsError) {
          console.error('Supabase events error:', eventsError);
        }
      } catch (error) {
        console.error('Error querying calendar_events table:', error);
        eventsError = error;
      }

      if (clientsError) {
        console.error('Error loading clients from Supabase:', clientsError);
        
        // בדיקה אם הטבלאות לא קיימות
        if (clientsError.message && clientsError.message.includes('does not exist')) {
          toast({
            title: "טבלאות לא קיימות",
            description: "יש ליצור את הטבלאות בסופו בייס. ראה קובץ create_tables.sql",
            variant: "destructive"
          });
        } else {
          toast({
            title: "אזהרה",
            description: "לא ניתן לטעון נתוני לקוחות מהענן, משתמש בנתונים מקומיים",
            variant: "destructive"
          });
        }
      } else if (supabaseClients && supabaseClients.length > 0) {
        // Merge with localStorage data
        const mergedClients = mergeClients(parsedClients, supabaseClients);
        setClients(mergedClients);
        saveClientsToLocalStorage(mergedClients);
        console.log('Synced clients with Supabase:', mergedClients);
      }

      if (eventsError) {
        console.error('Error loading events from Supabase:', eventsError);
        
        // בדיקה אם הטבלאות לא קיימות
        if (eventsError.message && eventsError.message.includes('does not exist')) {
          console.log('Calendar events table does not exist - this is expected if not created yet');
        } else {
          toast({
            title: "אזהרה",
            description: "לא ניתן לטעון אירועי לוח שנה מהענן, משתמש בנתונים מקומיים",
            variant: "destructive"
          });
        }
      } else if (supabaseEvents && supabaseEvents.length > 0) {
        // Merge with localStorage data
        const mergedEvents = mergeEvents(parsedEvents, supabaseEvents);
        setCalendarEvents(mergedEvents);
        saveEventsToLocalStorage(mergedEvents);
        console.log('Synced events with Supabase:', mergedEvents);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "שגיאה בטעינת נתונים",
        description: "לא ניתן לטעון נתונים",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Merge clients from localStorage and Supabase
  const mergeClients = (localClients: Client[], supabaseClients: any[]): Client[] => {
    const merged = new Map<string, Client>();
    
    // Add local clients
    localClients.forEach(client => {
      merged.set(client.id, client);
    });
    
    // Add/update with Supabase clients
    supabaseClients.forEach(client => {
      const existing = merged.get(client.id);
      if (!existing || new Date(client.updated_at) > new Date(existing.updated_at || 0)) {
        merged.set(client.id, {
          id: client.id,
          name: client.name,
          totalHours: client.total_hours || 0,
          sessions: client.sessions || [],
          created_at: client.created_at,
          updated_at: client.updated_at
        });
      }
    });
    
    return Array.from(merged.values());
  };

  // Merge calendar events from localStorage and Supabase
  const mergeEvents = (localEvents: CalendarEvent[], supabaseEvents: any[]): CalendarEvent[] => {
    const merged = new Map<string, CalendarEvent>();
    
    // Add local events
    localEvents.forEach(event => {
      merged.set(event.id, event);
    });
    
    // Add/update with Supabase events
    supabaseEvents.forEach(event => {
      const existing = merged.get(event.id);
      if (!existing || new Date(event.updated_at) > new Date(existing.updated_at || 0)) {
        merged.set(event.id, {
          id: event.id,
          date: event.date,
          clientId: event.client_id,
          clientName: event.client_name,
          hours: event.hours,
          description: event.description,
          startTime: event.start_time,
          endTime: event.end_time,
          type: event.type,
          created_at: event.created_at,
          updated_at: event.updated_at
        });
      }
    });
    
    return Array.from(merged.values());
  };

  // Save clients to both localStorage and Supabase
  const saveClients = async (clientsToSave: Client[]) => {
    try {
      // Save to localStorage first (immediate)
      saveClientsToLocalStorage(clientsToSave);
      
      // Then save to Supabase
      for (const client of clientsToSave) {
        const { error } = await supabase
          .from('clients')
          .upsert({
            id: client.id,
            name: client.name,
            total_hours: client.totalHours,
            sessions: client.sessions,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error saving client to Supabase:', error);
        }
      }
      
      console.log('Saved clients to both localStorage and Supabase:', clientsToSave);
      
    } catch (error) {
      console.error('Error saving clients:', error);
      toast({
        title: "אזהרה",
        description: "הנתונים נשמרו מקומית אך לא בענן",
        variant: "destructive"
      });
    }
  };

  // Save calendar events to both localStorage and Supabase
  const saveEvents = async (eventsToSave: CalendarEvent[]) => {
    try {
      // Save to localStorage first (immediate)
      saveEventsToLocalStorage(eventsToSave);
      
      // Then save to Supabase
      for (const event of eventsToSave) {
        const { error } = await supabase
          .from('calendar_events')
          .upsert({
            id: event.id,
            date: event.date,
            client_id: event.clientId,
            client_name: event.clientName,
            hours: event.hours,
            description: event.description,
            start_time: event.startTime,
            end_time: event.endTime,
            type: event.type,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error saving event to Supabase:', error);
        }
      }
      
      console.log('Saved events to both localStorage and Supabase:', eventsToSave);
      
    } catch (error) {
      console.error('Error saving events:', error);
      toast({
        title: "אזהרה",
        description: "אירועי הלוח שנה נשמרו מקומית אך לא בענן",
        variant: "destructive"
      });
    }
  };

  // Save clients to localStorage only
  const saveClientsToLocalStorage = (clientsToSave: Client[]) => {
    try {
      localStorage.setItem('timeTrackingClients', JSON.stringify(clientsToSave));
      console.log('Saved clients to localStorage:', clientsToSave);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      toast({
        title: "שגיאה בשמירת נתונים",
        description: "לא ניתן לשמור נתונים מקומיים",
        variant: "destructive"
      });
    }
  };

  // Save calendar events to localStorage only
  const saveEventsToLocalStorage = (eventsToSave: CalendarEvent[]) => {
    try {
      localStorage.setItem('timeTrackingEvents', JSON.stringify(eventsToSave));
      console.log('Saved events to localStorage:', eventsToSave);
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
      toast({
        title: "שגיאה בשמירת אירועים",
        description: "לא ניתן לשמור אירועי לוח שנה מקומיים",
        variant: "destructive"
      });
    }
  };

  // Initial load
  useEffect(() => {
    loadClients();
  }, []);

  const refreshData = async () => {
    await loadClients();
    toast({
      title: "נתונים עודכנו",
      description: "הנתונים נטענו מחדש מהמאגר המקומי והענן",
    });
  };

  const addClient = async (name: string) => {
    try {
      console.log('Adding client:', name);

      const newClient: Client = {
        id: Date.now().toString(),
        name,
        totalHours: 0,
        sessions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedClients = [...clients, newClient];
      setClients(updatedClients);
      await saveClients(updatedClients);
      
      toast({
        title: "לקוח נוסף",
        description: `הלקוח "${name}" נוסף בהצלחה`,
      });

    } catch (error) {
      console.error('Error adding client:', error);
      toast({
        title: "שגיאה בהוספת לקוח",
        description: "לא ניתן להוסיף את הלקוח, נסה שוב",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      console.log('Deleting client:', clientId);
      
      const updatedClients = clients.filter(client => client.id !== clientId);
      setClients(updatedClients);
      await saveClients(updatedClients);
      
      // Also delete from Supabase
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('Error deleting from Supabase:', error);
      }
      
      toast({
        title: "לקוח נמחק",
        description: "הלקוח נמחק בהצלחה",
      });

    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "שגיאה במחיקת לקוח",
        description: "לא ניתן למחוק את הלקוח, נסה שוב",
        variant: "destructive"
      });
      throw error;
    }
  };

  const addTimeSession = async (clientId: string, hours: number, description: string = '') => {
    try {
      console.log('Adding time session:', { clientId, hours, description });
      
          const newSession = {
            date: new Date().toLocaleDateString('he-IL'),
            hours,
            description
          };
          
      const updatedClients = clients.map(client => {
        if (client.id === clientId) {
          return {
            ...client,
            totalHours: client.totalHours + hours,
            sessions: [newSession, ...client.sessions],
            updated_at: new Date().toISOString()
          };
        }
        return client;
      });

      setClients(updatedClients);
      await saveClients(updatedClients);
      
      toast({
        title: "זמן נוסף בהצלחה",
        description: `${hours.toFixed(2)} שעות נוספו ללקוח`,
      });

    } catch (error) {
      console.error('Error adding time session:', error);
      toast({
        title: "שגיאה בהוספת זמן",
        description: "לא ניתן להוסיף את הזמן, נסה שוב",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Calendar Events Management
  const addCalendarEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      console.log('Adding calendar event:', eventData);
      
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        ...eventData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedEvents = [...calendarEvents, newEvent];
      setCalendarEvents(updatedEvents);
      await saveEvents(updatedEvents);
      
      toast({
        title: "אירוע נוסף",
        description: "האירוע נוסף ללוח השנה בהצלחה",
      });

    } catch (error) {
      console.error('Error adding calendar event:', error);
      toast({
        title: "שגיאה בהוספת אירוע",
        description: "לא ניתן להוסיף את האירוע, נסה שוב",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateCalendarEvent = async (event: CalendarEvent) => {
    try {
      console.log('Updating calendar event:', event);
      
      const updatedEvents = calendarEvents.map(e => 
        e.id === event.id ? { ...event, updated_at: new Date().toISOString() } : e
      );
      
      setCalendarEvents(updatedEvents);
      await saveEvents(updatedEvents);
      
      toast({
        title: "אירוע עודכן",
        description: "האירוע עודכן בהצלחה",
      });

    } catch (error) {
      console.error('Error updating calendar event:', error);
      toast({
        title: "שגיאה בעדכון אירוע",
        description: "לא ניתן לעדכן את האירוע, נסה שוב",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteCalendarEvent = async (eventId: string) => {
    try {
      console.log('Deleting calendar event:', eventId);
      
      const updatedEvents = calendarEvents.filter(event => event.id !== eventId);
      setCalendarEvents(updatedEvents);
      await saveEvents(updatedEvents);
      
      // Also delete from Supabase
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting event from Supabase:', error);
      }
      
      toast({
        title: "אירוע נמחק",
        description: "האירוע נמחק בהצלחה",
      });

    } catch (error) {
      console.error('Error deleting calendar event:', error);
      toast({
        title: "שגיאה במחיקת אירוע",
        description: "לא ניתן למחוק את האירוע, נסה שוב",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getEventsForClient = (clientId: string) => {
    return calendarEvents.filter(event => event.clientId === clientId);
  };

  const getEventsForDate = (date: string) => {
    return calendarEvents.filter(event => event.date === date);
  };

  return {
    clients,
    calendarEvents,
    loading,
    addClient,
    deleteClient,
    addTimeSession,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getEventsForClient,
    getEventsForDate,
    refreshData
  };
};
