import React from 'react'; 
import Checkbox from './Checkbox';

interface ReviewCardProps {
  clientName: string;
  clientInitial: string;
  date: string;
  comment: string;
  rating: number;
  avatarColor: string;
  checked: boolean;
  onCheck: (checked: boolean) => void;
}

export function ReviewCard({ clientName, clientInitial, date, comment, rating, avatarColor, checked, onCheck }: ReviewCardProps) {
  return (
    <div className="flex flex-col p-4 border rounded-lg shadow-sm space-y-2">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold`}>
          {clientInitial}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{clientName}</h4>
          <span className="text-xs text-gray-500">{new Date(date).toLocaleDateString('fr-FR')}</span>
        </div>
        <Checkbox checked={checked} onChange={onCheck} />
      </div>
      <p className="text-sm text-gray-700">{comment}</p>
      <div className="flex items-center">
        <span className="text-xs text-gray-500">Note :</span>
        <span className="ml-1 text-sm font-semibold text-[#F17922]">{rating} ★</span>
      </div>
    </div>
  );
}