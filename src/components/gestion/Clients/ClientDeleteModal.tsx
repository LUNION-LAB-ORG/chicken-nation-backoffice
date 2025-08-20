import React, { useState } from 'react'
import Modal from '@/components/ui/Modal'

interface Client {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface ClientDeleteModalProps {
  open: boolean
  client: Client | null
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

const ClientDeleteModal: React.FC<ClientDeleteModalProps> = ({ 
  open, 
  client, 
  onClose, 
  onConfirm, 
  isLoading = false 
}) => {
  const [confirmationStep, setConfirmationStep] = useState(1) // Étape 1: Première confirmation, Étape 2: Confirmation finale
  const [confirmText, setConfirmText] = useState('')

  // Nom complet du client
  const clientName = client ? 
    `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email || 'Client' 
    : 'Client'

  // Texte de confirmation requis
  const requiredText = 'SUPPRIMER LE CLIENT'

  const handleClose = () => {
    setConfirmationStep(1)
    setConfirmText('')
    onClose()
  }

  const handleFirstConfirm = () => {
    setConfirmationStep(2)
  }

  const handleFinalConfirm = () => {
    if (confirmText === requiredText) {
      onConfirm()
      // Reset après confirmation
      setConfirmationStep(1)
      setConfirmText('')
    }
  }

  const isConfirmDisabled = confirmationStep === 2 && confirmText !== requiredText

  return (
    <Modal 
      isOpen={open} 
      onClose={handleClose} 
      title={confirmationStep === 1 ? "Supprimer le client" : "Confirmation finale"}
    >
      {confirmationStep === 1 ? (
        // Première étape de confirmation
        <div>
          <div className="text-center text-[#484848] text-[16px] mb-6">
            <div className="mb-4">
              <strong>{clientName}</strong>
            </div>
            <div className="text-red-600 font-medium mb-2">
              ⚠️ Action irréversible
            </div>
            <div>
              Le client perdra totalement tout accès à ses données.<br />
              Toutes ses commandes et informations seront supprimées.<br />
              <strong>Cette action ne peut pas être annulée.</strong>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <button 
              type="button" 
              className="bg-[#ECECEC] text-[#9796A1] cursor-pointer rounded-lg px-7 py-2 text-[13px] min-w-[120px]" 
              onClick={handleClose}
            >
              Annuler
            </button>
            <button 
              type="button" 
              className="bg-red-500 text-white cursor-pointer rounded-lg px-7 py-2 text-[13px] min-w-[120px] hover:bg-red-600" 
              onClick={handleFirstConfirm}
            >
              Continuer
            </button>
          </div>
        </div>
      ) : (
        // Deuxième étape - Confirmation finale avec saisie
        <div>
          <div className="text-center text-[#484848] text-[16px] mb-6">
            <div className="mb-4">
              <strong>{clientName}</strong>
            </div>
            <div className="text-red-600 font-medium mb-4">
              🔒 Confirmation de sécurité requise
            </div>
            <div className="mb-4">
              Pour confirmer la suppression définitive,<br />
              tapez exactement : <strong className="text-red-600">{requiredText}</strong>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Tapez la confirmation..."
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-center font-mono text-sm focus:border-red-500 focus:outline-none"
              autoComplete="off"
            />
          </div>
          <div className="flex justify-center gap-4">
            <button 
              type="button" 
              className="bg-[#ECECEC] text-[#9796A1] cursor-pointer rounded-lg px-7 py-2 text-[13px] min-w-[120px]" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button 
              type="button" 
              className={`rounded-lg px-7 py-2 text-[13px] min-w-[120px] ${
                isConfirmDisabled || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white cursor-pointer hover:bg-red-600'
              }`}
              onClick={handleFinalConfirm}
              disabled={isConfirmDisabled || isLoading}
            >
              {isLoading ? 'Suppression...' : 'Supprimer définitivement'}
            </button>
          </div>
          {confirmText && confirmText !== requiredText && (
            <div className="text-center text-red-500 text-xs mt-2">
              Le texte saisi ne correspond pas à la confirmation requise
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default ClientDeleteModal