import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

interface CalendarEvent {
  id: string;
  date: string;
  clientId?: string;
  clientName?: string;
  hours: number;
  description: string;
  startTime?: string;
  endTime?: string;
  type: 'session' | 'meeting' | 'task' | 'other';
}

interface CalendarProps {
  clients: Array<{ id: string; name: string }>;
  events?: CalendarEvent[];
  onEventAdd?: (event: Omit<CalendarEvent, 'id'>) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  selectedClientId?: string;
}

type ViewMode = 'day' | 'week' | 'month' | 'year';

const Calendar: React.FC<CalendarProps> = ({
  clients,
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  selectedClientId
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newEvent, setNewEvent] = useState({
    hours: 0,
    description: '',
    startTime: '',
    endTime: '',
    type: 'session' as const,
    clientId: selectedClientId || ''
  });

  // פונקציות ניווט
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // פונקציות עזר לתאריכים
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const handleAddEvent = () => {
    if (newEvent.hours > 0 && newEvent.description && selectedDate) {
      const eventData = {
        date: selectedDate,
        hours: newEvent.hours,
        description: newEvent.description,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        type: newEvent.type,
        clientId: newEvent.clientId || undefined,
        clientName: clients.find(c => c.id === newEvent.clientId)?.name
      };
      
      onEventAdd?.(eventData);
      setNewEvent({
        hours: 0,
        description: '',
        startTime: '',
        endTime: '',
        type: 'session',
        clientId: selectedClientId || ''
      });
      setShowAddEvent(false);
    }
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const totalHours = dayEvents.reduce((sum, event) => sum + event.hours, 0);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800">{formatDate(currentDate)}</h3>
          <p className="text-gray-600">סה"כ שעות: {totalHours.toFixed(1)}</p>
        </div>
        
        <div className="space-y-3">
          {dayEvents.map((event) => (
            <Card key={event.id} className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-800">{event.hours} שעות</p>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      {event.clientName && (
                        <Badge variant="secondary" className="mt-1">
                          {event.clientName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {event.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          
          return (
            <div
              key={index}
              className={`min-h-32 p-2 border rounded-lg ${
                isToday ? 'bg-blue-100 border-blue-300' : 
                isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className="text-center mb-2">
                <p className={`text-sm font-medium ${
                  isToday ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {day.toLocaleDateString('he-IL', { weekday: 'short' })}
                </p>
                <p className={`text-lg font-bold ${
                  isToday ? 'text-blue-600' : 'text-gray-800'
                }`}>
                  {day.getDate()}
                </p>
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 bg-blue-100 rounded text-blue-800 truncate"
                    title={`${event.hours} שעות - ${event.description}`}
                  >
                    {event.hours}h - {event.description.substring(0, 15)}...
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 3} עוד
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthDays = getMonthDays();
    const monthName = currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
    
    return (
      <div>
        <h3 className="text-xl font-bold text-center mb-4 text-gray-800">{monthName}</h3>
        <div className="grid grid-cols-7 gap-1">
          {/* כותרות ימי השבוע */}
          {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day) => (
            <div key={day} className="p-2 text-center font-bold text-gray-600 bg-gray-100 rounded">
              {day}
            </div>
          ))}
          
          {/* ימי החודש */}
          {monthDays.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const totalHours = dayEvents.reduce((sum, event) => sum + event.hours, 0);
            
            return (
              <div
                key={index}
                className={`min-h-20 p-1 border rounded cursor-pointer hover:bg-blue-50 transition-colors ${
                  isToday ? 'bg-blue-100 border-blue-300' : 
                  isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                }`}
                onClick={() => {
                  setSelectedDate(day.toISOString().split('T')[0]);
                  setShowAddEvent(true);
                }}
              >
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    isToday ? 'text-blue-600' : 
                    isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {day.getDate()}
                  </p>
                  {totalHours > 0 && (
                    <p className="text-xs text-green-600 font-bold">
                      {totalHours.toFixed(1)}h
                    </p>
                  )}
                  {dayEvents.length > 0 && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [];
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      const monthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
      });
      const totalHours = monthEvents.reduce((sum, event) => sum + event.hours, 0);
      
      months.push({
        month,
        name: monthDate.toLocaleDateString('he-IL', { month: 'short' }),
        totalHours,
        eventCount: monthEvents.length
      });
    }
    
    return (
      <div>
        <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">{year}</h3>
        <div className="grid grid-cols-3 gap-4">
          {months.map(({ month, name, totalHours, eventCount }) => (
            <Card
              key={month}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setCurrentDate(new Date(year, month, 1));
                setViewMode('month');
              }}
            >
              <CardContent className="p-4 text-center">
                <h4 className="text-lg font-bold text-gray-800 mb-2">{name}</h4>
                <p className="text-sm text-green-600 font-semibold">{totalHours.toFixed(1)} שעות</p>
                <p className="text-xs text-gray-500">{eventCount} אירועים</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderView = () => {
    switch (viewMode) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
        return renderMonthView();
      case 'year':
        return renderYearView();
      default:
        return renderMonthView();
    }
  };

  return (
    <div className="space-y-6" dir="rtl" style={{direction: 'rtl', textAlign: 'right'}}>
      {/* כותרת וניווט */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            היום
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">יום</SelectItem>
              <SelectItem value="week">שבוע</SelectItem>
              <SelectItem value="month">חודש</SelectItem>
              <SelectItem value="year">שנה</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                הוסף אירוע
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-right">הוסף אירוע חדש</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                    תאריך
                  </label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-right"
                  />
                </div>
                
                {!selectedClientId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                      לקוח
                    </label>
                    <Select value={newEvent.clientId} onValueChange={(value) => setNewEvent({...newEvent, clientId: value})}>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="בחר לקוח" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                    שעות
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={newEvent.hours}
                    onChange={(e) => setNewEvent({...newEvent, hours: parseFloat(e.target.value) || 0})}
                    className="text-right"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                    סוג
                  </label>
                  <Select value={newEvent.type} onValueChange={(value: any) => setNewEvent({...newEvent, type: value})}>
                    <SelectTrigger className="text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">סשן</SelectItem>
                      <SelectItem value="meeting">פגישה</SelectItem>
                      <SelectItem value="task">משימה</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                    תיאור
                  </label>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="תיאור הפעילות..."
                    className="text-right"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                      שעת התחלה
                    </label>
                    <Input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                      className="text-right"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                      שעת סיום
                    </label>
                    <Input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                      className="text-right"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddEvent(false)} className="flex-1">
                    ביטול
                  </Button>
                  <Button onClick={handleAddEvent} className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600">
                    הוסף
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* תוכן הלוח שנה */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 border-purple-100">
        <CardContent className="p-6">
          {renderView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendar; 