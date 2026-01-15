import React from "react";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";

interface ManagerCredentialsModalProps {
  open: boolean;
  email: string;
  password: string;
  onClose: () => void;
}

const ManagerCredentialsModal: React.FC<ManagerCredentialsModalProps> = ({
  open,
  email,
  password,
  onClose,
}) => {
  return (
    <Modal isOpen={open} onClose={onClose} title={"Accès du gérant"}>
      <div className="flex flex-col gap-5 items-center">
        <div className="w-full flex flex-col gap-4 px-16 py-3">
          <div className="flex items-center justify-between bg-[#F7F7F7] rounded-xl px-4 py-2">
            <span className="text-[#595959] text-[13px]">Utilisateur</span>
            <span className="text-[#F17922] font-mono text-[15px]">
              {email}
            </span>
            <button
              className="bg-[#F17922] text-white text-xs px-6 py-1 cursor-pointer rounded-lg ml-4 hover:bg-[#f18c3b]"
              onClick={() => {
                navigator.clipboard.writeText(email);
                toast.success("Email copié !");
              }}
            >
              Copier
            </button>
          </div>
          <div className="flex items-center justify-between bg-[#F7F7F7] rounded-xl px-4 py-2">
            <span className="text-[#595959] text-[13px]">Mot de passe</span>
            <span className="text-[#F17922] font-regular text-[15px]">
              {password}
            </span>
            <button
              className="bg-[#F17922] text-white text-xs px-6 py-1 cursor-pointer rounded-lg ml-4 hover:bg-[#f18c3b]"
              onClick={() => {
                navigator.clipboard.writeText(password);
                toast.success("Mot de passe copié !");
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

export default ManagerCredentialsModal;
