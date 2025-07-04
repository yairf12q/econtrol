import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Plus, Edit3, Trash2, Timer, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import FloatingTimer from '@/components/FloatingTimer';
import Calendar from '@/components/Calendar';
import { useClients } from '@/hooks/useClients';

interface TableColumn {
  id: string;
  title: string;
}

const Index = () => {
  const { 
    clients, 
    calendarEvents,
    loading, 
    addClient, 
    deleteClient, 
    addTimeSession, 
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    refreshData 
  } = useClients();
  
  const [columns, setColumns] = useState<TableColumn[]>([
    { id: 'client', title: 'שם לקוח' },
    { id: 'hours', title: 'סך שעות' },
    { id: 'minutes', title: 'סך דקות' },
    { id: 'lastWork', title: 'עבודה אחרונה' },
    { id: 'actions', title: 'פעולות' }
  ]);

  const [newClientName, setNewClientName] = useState('');
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const { toast } = useToast();

  const handleAddClient = async () => {
    if (newClientName.trim()) {
      try {
        await addClient(newClientName.trim());
        setNewClientName('');
        setShowAddClient(false);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClient(clientId);
      setShowDeleteConfirm(null);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const addColumn = () => {
    if (newColumnTitle.trim()) {
      const newColumn: TableColumn = {
        id: Date.now().toString(),
        title: newColumnTitle.trim()
      };
      // Insert before actions column
      const actionsIndex = columns.findIndex(col => col.id === 'actions');
      const newColumns = [...columns];
      newColumns.splice(actionsIndex, 0, newColumn);
      setColumns(newColumns);
      setNewColumnTitle('');
      setShowAddColumn(false);
      toast({
        title: "עמודה נוספה",
        description: `עמודה "${newColumn.title}" נוספה לטבלה`,
      });
    }
  };

  const updateColumnTitle = (columnId: string, newTitle: string) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, title: newTitle } : col
    ));
    setEditingColumn(null);
    toast({
      title: "כותרת עודכנה",
      description: "שם העמודה עודכן בהצלחה",
    });
  };

  const handleAddTimeToClient = async (clientId: string, hours: number) => {
    try {
      await addTimeSession(clientId, hours);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const formatMinutes = (hours: number) => {
    return Math.round(hours * 60);
  };

  const getTotalHours = () => {
    return clients.reduce((total, client) => total + client.totalHours, 0);
  };

  const getTotalMinutes = () => {
    return Math.round(getTotalHours() * 60);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-xl shadow-2xl p-6 mb-6 border border-purple-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div className="text-right">
                <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                  e-control
                </h1>
                <p className="text-lg font-medium bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mt-2">
                  אנרגיה - אינטגרציה - בקרים - מערכות חכמות - טכנולוגיות מתקדמות
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={refreshData}
                variant="outline"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <RefreshCw className="w-4 h-4 text-blue-600" />
                רענן נתונים
              </Button>
              
              <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <Plus className="w-4 h-4 mr-2" />
                    הוסף לקוח
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-right">הוסף לקוח חדש</DialogTitle>
                    <DialogDescription className="text-right">
                      הכנס את שם הלקוח החדש
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="שם הלקוח"
                    className="text-right"
                  />
                  <DialogFooter>
                    <Button onClick={handleAddClient}>הוסף</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    הוסף עמודה
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-right">הוסף עמודה חדשה</DialogTitle>
                    <DialogDescription className="text-right">
                      הכנס את כותרת העמודה החדשה
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="כותרת העמודה"
                    className="text-right"
                  />
                  <DialogFooter>
                    <Button onClick={addColumn}>הוסף</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={() => setShowCalendar(!showCalendar)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                {showCalendar ? 'הסתר לוח שנה' : 'הצג לוח שנה'}
              </Button>
            </div>
          </div>

          <div className="overflow-auto max-h-96 border-2 border-purple-200 rounded-xl shadow-inner bg-gradient-to-br from-white to-blue-50" dir="rtl">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-600 sticky top-0 z-10">
                <tr>
                  {columns.map((column) => (
                    <th key={column.id} className="p-4 text-right font-bold text-white border-b border-purple-400" style={{textAlign: 'right'}}>
                      {editingColumn === column.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingColumnTitle}
                            onChange={(e) => setEditingColumnTitle(e.target.value)}
                            onBlur={() => updateColumnTitle(column.id, editingColumnTitle)}
                            onKeyPress={(e) => e.key === 'Enter' && updateColumnTitle(column.id, editingColumnTitle)}
                            className="h-8 text-sm text-right"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-1 rounded"
                          onClick={() => {
                            if (column.id !== 'actions' && column.id !== 'client') {
                              setEditingColumn(column.id);
                              setEditingColumnTitle(column.title);
                            }
                          }}
                        >
                          <span>{column.title}</span>
                          {column.id !== 'actions' && column.id !== 'client' && (
                            <Edit3 className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr key={client.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-blue-50 to-purple-50'} hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 transition-all duration-300 border-b border-purple-100`}>
                    <td className="p-4 font-medium text-blue-600 sticky right-0 bg-inherit border-l text-right" style={{textAlign: 'right'}}>
                      <Link 
                        to={`/client/${client.id}`}
                        className="hover:underline flex items-center gap-2 justify-end text-blue-600 hover:text-purple-600 transition-all duration-300 hover:scale-105 font-semibold"
                      >
                        <Timer className="w-4 h-4" />
                        {client.name}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-800 font-semibold text-right" style={{textAlign: 'right'}}>
                      {client.totalHours.toFixed(1)} שעות
                    </td>
                    <td className="p-4 text-gray-800 font-semibold text-right" style={{textAlign: 'right'}}>
                      {formatMinutes(client.totalHours)} דקות
                    </td>
                    <td className="p-4 text-gray-600 text-right" style={{textAlign: 'right'}}>
                      {client.sessions.length > 0 ? client.sessions[0].date : 'אין נתונים'}
                    </td>
                    <td className="p-4" style={{textAlign: 'right'}}>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg"
                          onClick={() => setShowDeleteConfirm(client.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Summary Row */}
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600 font-bold border-t-2 border-purple-400">
                  <td className="p-4 text-white sticky right-0 bg-gradient-to-r from-blue-600 to-purple-600 border-l border-purple-400 text-right" style={{textAlign: 'right'}}>
                    סך הכל
                  </td>
                  <td className="p-4 text-white text-right" style={{textAlign: 'right'}}>
                    {getTotalHours().toFixed(1)} שעות
                  </td>
                  <td className="p-4 text-white text-right" style={{textAlign: 'right'}}>
                    {getTotalMinutes()} דקות
                  </td>
                  <td className="p-4 text-white text-right" style={{textAlign: 'right'}}>
                    סיכום כללי
                  </td>
                  <td className="p-4" style={{textAlign: 'right'}}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <>
        {/* לוח שנה */}
        {showCalendar && (
          <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-xl shadow-2xl p-6 mb-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                לוח שנה
              </h2>
            </div>
            
            <Calendar
              clients={clients}
              events={calendarEvents}
              onEventAdd={addCalendarEvent}
              onEventUpdate={updateCalendarEvent}
              onEventDelete={deleteCalendarEvent}
            />
          </div>
        )}

        <FloatingTimer clients={clients} onTimeAdded={handleAddTimeToClient} />

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">אישור מחיקה</DialogTitle>
            <DialogDescription className="text-right">
              האם אתה בטוח שברצונך למחוק את הלקוח? פעולה זו לא ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              ביטול
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showDeleteConfirm && handleDeleteClient(showDeleteConfirm)}
            >
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
    </div>
  );
};

export default Index;
