import React from 'react';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

interface UserCredentialsModalProps {
  open: boolean;
  email: string;
  password: string;
  onClose: () => void;
}

const UserCredentialsModal: React.FC<UserCredentialsModalProps> = ({ open, email, password, onClose }) => {
  return (
    <Modal isOpen={open} onClose={onClose} title={"Accès de l'utilisateur"}>
      <div className="flex flex-col gap-5 items-center">
        <div className="w-full flex flex-col gap-4 px-4 sm:px-8 md:px-16 py-3">
          {/* Email Field */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#F7F7F7] rounded-xl px-4 py-3 gap-3 sm:gap-0">
            <div className="flex items-center min-w-[120px]">
              <span className="text-[#595959] text-sm sm:text-[13px]">Utilisateur</span>
            </div>
            
            <div className="flex-1 min-w-0 mx-2">
              <span className="text-[#F17922] font-mono text-sm sm:text-[15px] truncate block" title={email}>
                {email}
              </span>
            </div>
            
            <button
              className="bg-[#F17922] text-white text-xs px-4 py-2 sm:px-6 sm:py-1 cursor-pointer rounded-lg hover:bg-[#f18c3b] transition-colors w-full sm:w-auto mt-2 sm:mt-0"
              onClick={() => {
                navigator.clipboard.writeText(email);
                toast.success('Email copié !');
              }}
            >
              Copier
            </button>
          </div>

          {/* Password Field */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#F7F7F7] rounded-xl px-4 py-3 gap-3 sm:gap-0">
            <div className="flex items-center min-w-[120px]">
              <span className="text-[#595959] text-sm sm:text-[13px]">Mot de passe</span>
            </div>
            
            <div className="flex-1 min-w-0 mx-2">
              <span className="text-[#F17922] font-regular text-sm sm:text-[15px] truncate block" title={password}>
                {password}
              </span>
            </div>
            
            <button
              className="bg-[#F17922] text-white text-xs px-4 py-2 sm:px-6 sm:py-1 cursor-pointer rounded-lg hover:bg-[#f18c3b] transition-colors w-full sm:w-auto mt-2 sm:mt-0"
              onClick={() => {
                navigator.clipboard.writeText(password);
                toast.success('Mot de passe copié !');
              }}
            >
              Copier
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default UserCredentialsModal;