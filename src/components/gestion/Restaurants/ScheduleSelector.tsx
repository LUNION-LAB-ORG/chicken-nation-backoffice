"use client"

import React, { useState, useRef, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
// import { Clock } from 'lucide-react' // Non utilisé actuellement

interface Schedule {
  [day: string]: string;
}

interface ScheduleSelectorProps {
  schedule: Schedule[];
  onChange: (schedule: Schedule[]) => void;
}

// Composant TimePicker pour sélectionner les heures
interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, onClose }) => {
 
  const [startHour, setStartHour] = useState<number>(8);
  const [startMinute, setStartMinute] = useState<number>(0);
  const [endHour, setEndHour] = useState<number>(22);
  const [endMinute, setEndMinute] = useState<number>(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    if (value && value !== 'Fermé') {
      const parts = value.split('-');
      if (parts.length === 2) {
        const startParts = parts[0].trim().split(':');
        const endParts = parts[1].trim().split(':');
        
        if (startParts.length === 2) {
          setStartHour(parseInt(startParts[0], 10) || 8);
          setStartMinute(parseInt(startParts[1], 10) || 0);
        }
        
        if (endParts.length === 2) {
          setEndHour(parseInt(endParts[0], 10) || 22);
          setEndMinute(parseInt(endParts[1], 10) || 0);
        }
      }
    }
  }, [value]);

 
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  
  const updateValue = () => {
    const formattedStartHour = startHour.toString().padStart(2, '0');
    const formattedStartMinute = startMinute.toString().padStart(2, '0');
    const formattedEndHour = endHour.toString().padStart(2, '0');
    const formattedEndMinute = endMinute.toString().padStart(2, '0');
    
    const newValue = `${formattedStartHour}:${formattedStartMinute}-${formattedEndHour}:${formattedEndMinute}`;
    onChange(newValue);
  };
 
  const incrementStartHour = () => {
    setStartHour(prev => (prev >= 23 ? 0 : prev + 1));
    updateValue();
  };

  const decrementStartHour = () => {
    setStartHour(prev => (prev <= 0 ? 23 : prev - 1));
    updateValue();
  };

  const incrementStartMinute = () => {
    setStartMinute(prev => {
      const newValue = prev + 15;
      return newValue >= 60 ? 0 : newValue;
    });
    updateValue();
  };

  const decrementStartMinute = () => {
    setStartMinute(prev => {
      const newValue = prev - 15;
      return newValue < 0 ? 45 : newValue;
    });
    updateValue();
  };

  const incrementEndHour = () => {
    setEndHour(prev => (prev >= 23 ? 0 : prev + 1));
    updateValue();
  };

  const decrementEndHour = () => {
    setEndHour(prev => (prev <= 0 ? 23 : prev - 1));
    updateValue();
  };

  const incrementEndMinute = () => {
    setEndMinute(prev => {
      const newValue = prev + 15;
      return newValue >= 60 ? 0 : newValue;
    });
    updateValue();
  };

  const decrementEndMinute = () => {
    setEndMinute(prev => {
      const newValue = prev - 15;
      return newValue < 0 ? 45 : newValue;
    });
    updateValue();
  };

   const applyPreset = (preset: string) => {
    if (preset === 'Fermé') {
      onChange('Fermé');
      onClose();
    } else {
      const parts = preset.split('-');
      if (parts.length === 2) {
        const startParts = parts[0].split(':');
        const endParts = parts[1].split(':');
        
        if (startParts.length === 2) {
          setStartHour(parseInt(startParts[0], 10));
          setStartMinute(parseInt(startParts[1], 10));
        }
        
        if (endParts.length === 2) {
          setEndHour(parseInt(endParts[0], 10));
          setEndMinute(parseInt(endParts[1], 10));
        }
        
        onChange(preset);
      }
    }
  };

  return (
    <div 
      ref={pickerRef}
      className="absolute z-50 top-full mt-1 dark:text-gray-700 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64 max-w-[calc(100vw-40px)]"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '264px'
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-gray-700">Sélectionner l&apos;horaire</h4>
        <button 
          type="button"
          onClick={onClose}
          className="text-gray-400 dark:text-gray-700 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="text-center">
          <span className="text-xs text-gray-500 block mb-1">Ouverture</span>
          <div className="flex items-center">
            {/* Heure d'ouverture */}
            <div className="flex flex-col items-center">
              <button 
                type="button"
                onClick={incrementStartHour}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronUp size={14} />
              </button>
              <span className="mx-1 text-sm font-medium w-6 text-center">
                {startHour.toString().padStart(2, '0')}
              </span>
              <button 
                type="button"
                onClick={decrementStartHour}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            
            <span className="mx-1 text-sm">:</span>
            
            {/* Minute d'ouverture */}
            <div className="flex flex-col items-center">
              <button 
                type="button"
                onClick={incrementStartMinute}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronUp size={14} />
              </button>
              <span className="mx-1 text-sm font-medium w-6 text-center">
                {startMinute.toString().padStart(2, '0')}
              </span>
              <button 
                type="button"
                onClick={decrementStartMinute}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
        
        <span className="text-sm font-medium">-</span>
        
        <div className="text-center">
          <span className="text-xs text-gray-500 block mb-1">Fermeture</span>
          <div className="flex items-center">
            {/* Heure de fermeture */}
            <div className="flex flex-col items-center">
              <button 
                type="button"
                onClick={incrementEndHour}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronUp size={14} />
              </button>
              <span className="mx-1 text-sm font-medium w-6 text-center">
                {endHour.toString().padStart(2, '0')}
              </span>
              <button 
                type="button"
                onClick={decrementEndHour}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            
            <span className="mx-1 text-sm">:</span>
            
            {/* Minute de fermeture */}
            <div className="flex flex-col items-center">
              <button 
                type="button"
                onClick={incrementEndMinute}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronUp size={14} />
              </button>
              <span className="mx-1 text-sm font-medium w-6 text-center">
                {endMinute.toString().padStart(2, '0')}
              </span>
              <button 
                type="button"
                onClick={decrementEndMinute}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button 
          type="button"
          onClick={() => applyPreset('08:00-22:00')}
          className="text-xs bg-gray-50 hover:bg-gray-100 py-1 px-2 rounded"
        >
          08:00-22:00
        </button>
        <button 
          type="button"
          onClick={() => applyPreset('09:00-21:00')}
          className="text-xs bg-gray-50 hover:bg-gray-100 py-1 px-2 rounded"
        >
          09:00-21:00
        </button>
        <button 
          type="button"
          onClick={() => applyPreset('10:00-20:00')}
          className="text-xs bg-gray-50 hover:bg-gray-100 py-1 px-2 rounded"
        >
          10:00-20:00
        </button>
        <button 
          type="button"
          onClick={() => applyPreset('Fermé')}
          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 py-1 px-2 rounded"
        >
          Fermé
        </button>
      </div>
      
      <div className="flex justify-end">
        <button 
          type="button"
          onClick={() => {
            updateValue();
            onClose();
          }}
          className="text-xs bg-[#F17922] text-white py-1 px-3 rounded hover:bg-[#F17922]/90"
        >
          Appliquer
        </button>
      </div>
    </div>
  );
};

export default function ScheduleSelector({ schedule, onChange }: ScheduleSelectorProps) {
 
  const daysOfWeek = [
    { id: '1', label: 'Lundi' },
    { id: '2', label: 'Mardi' },
    { id: '3', label: 'Mercredi' },
    { id: '4', label: 'Jeudi' },
    { id: '5', label: 'Vendredi' },
    { id: '6', label: 'Samedi' },
    { id: '7', label: 'Dimanche' },
  ];

  
  const [activeTimePickerDay, setActiveTimePickerDay] = useState<string | null>(null);

 
  function getScheduleForDay(dayId: string): string {
    if (!Array.isArray(schedule)) return '';
    
    const daySchedule = schedule.find(item => Object.keys(item)[0] === dayId);
    return daySchedule ? daySchedule[dayId] : '';
  }

 
  const handleScheduleChange = (dayId: string, value: string) => {
    const newSchedule = [...schedule];
    const dayIndex = newSchedule.findIndex(item => Object.keys(item)[0] === dayId);
    
    if (dayIndex !== -1) {
      newSchedule[dayIndex] = { [dayId]: value };
    } else {
      newSchedule.push({ [dayId]: value });
    }
    
    onChange(newSchedule);
  };

   
  const applyToAllDays = (value: string) => {
    const newSchedule = daysOfWeek.map(day => ({ [day.id]: value }));
    onChange(newSchedule);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-700">Horaires d&apos;ouverture</h3>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex justify-end mb-2">
          <div className="flex flex-wrap gap-1 items-center text-xs">
            <span className="text-gray-500">Appliquer:</span>
            <button
              type="button"
              onClick={() => applyToAllDays('08:00-22:00')}
              className="px-2 py-1 bg-white border border-gray-200 hover:bg-gray-100 dark:text-gray-700 rounded-md"
            >
              08:00-22:00
            </button>
            <button
              type="button"
              onClick={() => applyToAllDays('Fermé')}
              className="px-2 py-1 bg-white border border-gray-200 dark:text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Fermé
            </button>
          </div>
        </div>
        
        {daysOfWeek.map(day => (
          <div key={day.id} className="flex items-center py-1.5 border-b border-gray-100 last:border-b-0">
            <span className="w-20 text-xs font-medium text-gray-600 dark:text-gray-700">{day.label}:</span>
            <div className="flex-1 flex items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={getScheduleForDay(day.id)}
                  onChange={(e) => handleScheduleChange(day.id, e.target.value)}
                  onClick={() => setActiveTimePickerDay(day.id)}
                  placeholder="08:00-22:00"
                  className="w-full h-[30px] rounded-lg bg-white border border-[#D8D8D8] dark:text-gray-700 px-2 text-xs cursor-pointer"
                />
                {getScheduleForDay(day.id) === 'Fermé' && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-500">
                    ●
                  </div>
                )}
                
                {activeTimePickerDay === day.id && (
                  <TimePicker 
                    value={getScheduleForDay(day.id)}
                    onChange={(value) => handleScheduleChange(day.id, value)}
                    onClose={() => setActiveTimePickerDay(null)}
                  />
                )}
              </div>
              <div className="flex ml-1">
                <button
                  type="button"
                  onClick={() => handleScheduleChange(day.id, '08:00-22:00')}
                  className="w-6 h-[30px] flex items-center justify-center dark:text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-l-md text-[10px] text-gray-500"
                  title="08:00-22:00"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => handleScheduleChange(day.id, 'Fermé')}
                  className="w-6 h-[30px] flex items-center dark:text-gray-700 justify-center bg-white border-t border-r border-b border-gray-200 hover:bg-gray-50 rounded-r-md text-[10px] text-red-500"
                  title="Fermé"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-700 mt-1 mb-3">
        Format: heure d&apos;ouverture - heure de fermeture (ex: 08:00-22:00) ou Fermé
      </div>
    </div>
  )
}
