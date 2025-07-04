import React, { useState, useRef, useEffect } from 'react';
import { Clock, Play, Pause, Square, Save, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  totalHours: number;
  sessions: Array<{ date: string; hours: number; description: string; }>;
}

interface FloatingTimerProps {
  clients: Client[];
  onTimeAdded: (clientId: string, hours: number) => Promise<void>;
}

const FloatingTimer: React.FC<FloatingTimerProps> = ({ clients, onTimeAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [lastSession, setLastSession] = useState<{ clientId: string; hours: number } | null>(null);
  const { toast } = useToast();

  // שמירת זמן כולל גם בהפסקות
  const totalSecondsRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // דיבאג: הדפסת כל שינוי
  useEffect(() => {
    console.log('STATE:', { isRunning, displaySeconds, totalSeconds: totalSecondsRef.current });
  }, [isRunning, displaySeconds]);

  // ניקוי טיימר ב-unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // התחלת טיימר
  const startTimer = () => {
    if (!selectedClient) {
      toast({
        title: "בחר לקוח",
        description: "נא לבחור לקוח לפני התחלת הטיימר",
        variant: "destructive"
      });
      return;
    }
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        totalSecondsRef.current += 1;
        setDisplaySeconds(totalSecondsRef.current);
      }, 1000);
      console.log('Timer started');
    }
  };

  // הפסקה
  const pauseTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDisplaySeconds(totalSecondsRef.current);
      console.log('Timer paused');
    }
  };

  // איפוס
  const resetTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    totalSecondsRef.current = 0;
    setDisplaySeconds(0);
    console.log('Timer reset');
  };

  // שמירה וסיום
  const stopAndSave = async () => {
    if (selectedClient && totalSecondsRef.current > 0) {
      try {
        const hours = parseFloat((totalSecondsRef.current / 3600).toFixed(4));
        await onTimeAdded(selectedClient, hours);
        setLastSession({ clientId: selectedClient, hours });
        const displayHours = Math.floor(totalSecondsRef.current / 3600);
        const displayMinutes = Math.floor((totalSecondsRef.current % 3600) / 60);
        const displaySeconds = totalSecondsRef.current % 60;
        toast({
          title: "זמן נשמר בהצלחה",
          description: `${displayHours}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')} נוספו ללקוח`,
        });
        console.log('Timer saved and reset');
      } catch (error) {
        console.error('Error saving time:', error);
        toast({
          title: "שגיאה בשמירת זמן",
          description: "לא ניתן לשמור את הזמן, נסה שוב",
          variant: "destructive"
        });
      }
    }
    resetTimer();
    setSelectedClient('');
    setIsOpen(false);
  };

  // הפעלה מחדש של סשן אחרון
  const restartLastSession = () => {
    if (lastSession) {
      setSelectedClient(lastSession.clientId);
      resetTimer();
      startTimer();
      toast({
        title: "הטיימר הופעל מחדש",
        description: `התחיל טיימר חדש עבור ${clients.find(c => c.id === lastSession.clientId)?.name}`,
      });
      console.log('Restarted last session');
    }
  };

  // עיצוב זמן
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-6 left-6 z-50" dir="ltr">
      {!isOpen ? (
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Clock className="w-8 h-8 text-white animate-pulse" />
          </Button>
          {lastSession && (
            <Button
              onClick={restartLastSession}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              title="הפעל מחדש את הטיימר האחרון"
            >
              <Repeat className="w-5 h-5 text-white" />
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-80 border-2 border-purple-100 animate-scale-in backdrop-blur-sm bg-opacity-95" dir="rtl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">טיימר עבודה</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setIsOpen(false);
                resetTimer();
              }}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full w-8 h-8 p-0"
            >
              ✕
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                בחר לקוח:
              </label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-full border-2 border-gray-200 rounded-lg focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="בחר לקוח..." />
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
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-gray-100 shadow-inner">
                {formatTime(displaySeconds)}
              </div>
              <div className="flex gap-2 justify-center">
                {!isRunning ? (
                  <Button 
                    onClick={startTimer}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    disabled={!selectedClient}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {displaySeconds > 0 ? 'המשך' : 'התחל'}
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseTimer}
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    הפסק
                  </Button>
                )}
                <Button 
                  onClick={stopAndSave}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  disabled={displaySeconds === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  שמור וסיים
                </Button>
              </div>
              {displaySeconds > 0 && !isRunning && (
                <div className="mt-2">
                  <Button 
                    onClick={resetTimer}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    אפס טיימר
                  </Button>
                </div>
              )}
            </div>
            {selectedClient && (
              <div className="text-sm text-gray-600 text-center bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                  {isRunning ? 'עובד עבור:' : 'מושהה עבור:'} <span className="font-semibold">{clients.find(c => c.id === selectedClient)?.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingTimer;
