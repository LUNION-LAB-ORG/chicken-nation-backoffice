"use client";

import React from "react";
import { Bell } from "lucide-react";

const NotificationSettings: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Notifications Push</h3>
      <p className="text-sm text-gray-500 mb-6">
        Configuration des services de notifications push (OneSignal, Expo Push)
      </p>

      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">
          Configuration des notifications push — disponible prochainement
        </p>
        <p className="text-gray-400 text-xs mt-2">
          Les paramètres OneSignal et Expo Push seront gérés ici
        </p>
      </div>
    </div>
  );
};

export default NotificationSettings;
