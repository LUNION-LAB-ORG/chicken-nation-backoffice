import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";

interface ManagerCredentialsDisplayProps {
  email: string;
  password: string;
}

const ManagerCredentialsDisplay: React.FC<ManagerCredentialsDisplayProps> = ({
  email,
  password,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);

      // Afficher un toast pour informer l'utilisateur
      toast.success("Veuillez noter les identifiants du gérant", {
        duration: 5000,
        position: "bottom-left",
        style: {
          background: "#F17922",
          color: "#fff",
          padding: "16px",
          borderRadius: "10px",
        },
        icon: "🔑",
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={"Accès du gérant"}>
      <div className="flex flex-col gap-5 items-center">
        <div className="w-full flex flex-col gap-4 px-16 py-3">
          <div className="flex items-center justify-between bg-hex-f7f7f7 rounded-xl px-4 py-2">
            <span className="text-hex-595959 text-[13px]">Utilisateur</span>
            <span className="text-[#F17922] font-mono text-[15px]">
              {email}
            </span>
            <button
              className="bg-[#F17922] text-blanc text-xs px-6 py-1 cursor-pointer rounded-lg ml-4 hover:bg-[#f18c3b]"
              onClick={() => {
                navigator.clipboard.writeText(email);
                toast.success("Email copié !");
              }}
            >
              Copier
            </button>
          </div>
          <div className="flex items-center justify-between bg-hex-f7f7f7 rounded-xl px-4 py-2">
            <span className="text-hex-595959 text-[13px]">Mot de passe</span>
            <span className="text-[#F17922] font-regular text-[15px]">
              {password}
            </span>
            <button
              className="bg-[#F17922] text-blanc text-xs px-6 py-1 cursor-pointer rounded-lg ml-4 hover:bg-[#f18c3b]"
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

export default ManagerCredentialsDisplay;
