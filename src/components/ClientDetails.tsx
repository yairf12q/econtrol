import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Edit3, Trash2, Plus, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Calendar from '@/components/Calendar';
import { useClients } from '@/hooks/useClients';

interface Session {
  id: string;
  hours: number;
  description: string;
  date: string;
}

interface Client {
  id: string;
  name: string;
  totalHours: number;
  sessions: Session[];
}

const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    calendarEvents, 
    addCalendarEvent, 
    updateCalendarEvent, 
    deleteCalendarEvent,
    getEventsForClient 
  } = useClients();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editHours, setEditHours] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSessionHours, setNewSessionHours] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      
      // Load client data from localStorage
      const savedClients = localStorage.getItem('timeTrackingClients');
      if (savedClients) {
        const clients: Client[] = JSON.parse(savedClients);
        const foundClient = clients.find(c => c.id === clientId);
        
        if (foundClient) {
          setClient(foundClient);
        } else {
          toast({
            title: "לקוח לא נמצא",
            description: "הלקוח המבוקש לא נמצא במערכת",
            variant: "destructive"
          });
          navigate('/');
        }
      } else {
        toast({
          title: "אין נתונים",
          description: "לא נמצאו נתונים במערכת",
          variant: "destructive"
        });
        navigate('/');
      }

    } catch (error) {
      console.error('Error loading client data:', error);
      toast({
        title: "שגיאה בטעינת נתונים",
        description: "לא ניתן לטעון את פרטי הלקוח",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveClientData = (updatedClient: Client) => {
    try {
      const savedClients = localStorage.getItem('timeTrackingClients');
      if (savedClients) {
        const clients: Client[] = JSON.parse(savedClients);
        const updatedClients = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
        localStorage.setItem('timeTrackingClients', JSON.stringify(updatedClients));
        setClient(updatedClient);
      }
    } catch (error) {
      console.error('Error saving client data:', error);
      toast({
        title: "שגיאה בשמירת נתונים",
        description: "לא ניתן לשמור את השינויים",
        variant: "destructive"
      });
    }
  };

  const formatMinutes = (hours: number) => {
    return Math.round(hours * 60);
  };

  const getTotalHours = () => {
    return client?.sessions.reduce((total, session) => total + session.hours, 0) || 0;
  };

  const getTotalMinutes = () => {
    return Math.round(getTotalHours() * 60);
  };

  const getClientEvents = () => {
    if (!clientId) return [];
    return getEventsForClient(clientId);
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const prevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const editSession = (sessionId: string) => {
    const session = client?.sessions.find(s => s.id === sessionId);
    if (session) {
      setEditingSession(sessionId);
      setEditHours(session.hours.toString());
      setEditDescription(session.description);
    }
  };

  const saveEdit = () => {
    if (!editingSession || !client) return;
    
    try {
      const oldSession = client.sessions.find(s => s.id === editingSession);
      if (!oldSession) return;

      const hoursDiff = parseFloat(editHours) - oldSession.hours;

      const updatedSessions = client.sessions.map(session =>
        session.id === editingSession
          ? { ...session, hours: parseFloat(editHours), description: editDescription }
          : session
      );

      const updatedClient = {
        ...client,
        totalHours: client.totalHours + hoursDiff,
        sessions: updatedSessions
      };

      saveClientData(updatedClient);
      setEditingSession(null);
      
      toast({
        title: "עדכון בוצע בהצלחה",
        description: "פרטי הסשן עודכנו",
      });
    } catch (error) {
      console.error('Error saving edit:', error);
      toast({
        title: "שגיאה בעדכון",
        description: "לא ניתן לעדכן את הסשן",
        variant: "destructive"
      });
    }
  };

  const deleteSession = (sessionId: string) => {
    if (!client) return;
    
    try {
      const sessionToDelete = client.sessions.find(s => s.id === sessionId);
      if (!sessionToDelete) return;

      const updatedSessions = client.sessions.filter(s => s.id !== sessionId);
      const updatedClient = {
        ...client,
        totalHours: client.totalHours - sessionToDelete.hours,
        sessions: updatedSessions
      };

      saveClientData(updatedClient);
      setDeleteConfirm(null);
      
      toast({
        title: "סשן נמחק",
        description: "הסשן נמחק בהצלחה",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "שגיאה במחיקה",
        description: "לא ניתן למחוק את הסשן",
        variant: "destructive"
      });
    }
  };

  const addSession = () => {
    if (!client || !newSessionHours) return;
    
    try {
      const hours = parseFloat(newSessionHours);
      if (isNaN(hours) || hours <= 0) {
        toast({
          title: "ערך לא תקין",
          description: "אנא הכנס מספר שעות תקין",
          variant: "destructive"
        });
        return;
      }

      const newSession: Session = {
        id: Date.now().toString(),
          hours,
          description: newSessionDescription,
        date: new Date().toLocaleDateString('he-IL')
      };

      const updatedClient = {
        ...client,
        totalHours: client.totalHours + hours,
        sessions: [newSession, ...client.sessions]
      };

      saveClientData(updatedClient);
      setShowAddSession(false);
      setNewSessionHours('');
      setNewSessionDescription('');
      
      toast({
        title: "סשן נוסף",
        description: `${hours.toFixed(2)} שעות נוספו בהצלחה`,
      });
    } catch (error) {
      console.error('Error adding session:', error);
      toast({
        title: "שגיאה בהוספת סשן",
        description: "לא ניתן להוסיף את הסשן",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען פרטי לקוח...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">לקוח לא נמצא</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            חזרה לדף הבית
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl" dir="rtl" style={{direction: 'rtl', textAlign: 'right'}}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
              <Button 
            variant="ghost"
            size="sm"
                onClick={() => navigate('/')}
            className="flex items-center space-x-2"
              >
            <ChevronLeft className="h-4 w-4" />
            <span>חזרה</span>
              </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">פרטי לקוח וסשנים</p>
              </div>
            </div>
        <Button onClick={loadClientData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
                רענן
              </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowRight className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">סה"כ שעות</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalHours().toFixed(2)}</p>
            </div>
          </div>
              </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowRight className="h-6 w-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">סה"כ דקות</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalMinutes()}</p>
            </div>
              </div>
            </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowRight className="h-6 w-6 text-purple-600" />
                </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">מספר סשנים</p>
              <p className="text-2xl font-bold text-gray-900">{client.sessions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Session Button */}
      <div className="mb-6 flex gap-3">
        <Button onClick={() => setShowAddSession(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>הוסף סשן חדש</span>
        </Button>
        
        <Button 
          onClick={() => setShowCalendar(!showCalendar)}
          variant="outline"
          className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          <span>{showCalendar ? 'הסתר לוח שנה' : 'הצג לוח שנה'}</span>
        </Button>
      </div>

      {/* לוח שנה */}
      {showCalendar && (
        <div className="mb-6 bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              לוח שנה - {client.name}
            </h2>
          </div>
          
          <Calendar
            clients={[{ id: client.id, name: client.name }]}
            events={getClientEvents()}
            onEventAdd={addCalendarEvent}
            onEventUpdate={updateCalendarEvent}
            onEventDelete={deleteCalendarEvent}
            selectedClientId={client.id}
          />
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">סשנים</h2>
        </div>
        
        {client.sessions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">אין סשנים עדיין</p>
            <Button onClick={() => setShowAddSession(true)} className="mt-4">
              הוסף סשן ראשון
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {client.sessions.map((session) => (
              <div key={session.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">{session.date}</div>
                      <div className="font-medium text-gray-900">
                        {session.hours.toFixed(2)} שעות
                      </div>
                      {session.description && (
                        <div className="text-gray-600">{session.description}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editSession(session.id)}
                    >
                      <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button 
                      variant="ghost"
                              size="sm" 
                              onClick={() => setDeleteConfirm(session.id)}
                      className="text-red-600 hover:text-red-700"
                            >
                      <Trash2 className="h-4 w-4" />
                            </Button>
                  </div>
                </div>
                      </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Session Dialog */}
      <Dialog open={showAddSession} onOpenChange={setShowAddSession}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוסף סשן חדש</DialogTitle>
            <DialogDescription>
              הכנס את פרטי הסשן החדש
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שעות
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newSessionHours}
                onChange={(e) => setNewSessionHours(e.target.value)}
                placeholder="לדוגמה: 2.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תיאור (אופציונלי)
              </label>
              <Input
                value={newSessionDescription}
                onChange={(e) => setNewSessionDescription(e.target.value)}
                placeholder="תיאור הסשן"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSession(false)}>
              ביטול
            </Button>
            <Button onClick={addSession}>
              הוסף סשן
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ערוך סשן</DialogTitle>
            <DialogDescription>
              שנה את פרטי הסשן
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שעות
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תיאור
              </label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>
              ביטול
            </Button>
            <Button onClick={saveEdit}>
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחק סשן</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק סשן זה? פעולה זו אינה הפיכה.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              ביטול
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && deleteSession(deleteConfirm)}
            >
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetails;
