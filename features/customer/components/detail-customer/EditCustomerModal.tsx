"use client";

import React, { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import { useCustomerUpdateMutation } from "../../queries/customer-edit.mutation";
import type { CustomerUpdatePayload } from "../../services/customer.service";
import type { Customer } from "../../types/customer.types";

interface Props {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Modal d'édition des infos d'identité d'un client (prénom, nom, email, téléphone)
 * pour un agent backoffice. Le téléphone est obligatoire ; l'email, s'il est saisi,
 * doit être valide. Les champs vides ne sont pas envoyés (pas d'écrasement involontaire).
 */
export function EditCustomerModal({ isOpen, customer, onClose }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useCustomerUpdateMutation();

  useEffect(() => {
    if (isOpen && customer) {
      setFirstName(customer.first_name ?? "");
      setLastName(customer.last_name ?? "");
      setEmail(customer.email ?? "");
      setPhone(customer.phone ?? "");
      setError(null);
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async () => {
    setError(null);

    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedPhone) {
      setError("Le numéro de téléphone est obligatoire");
      return;
    }
    if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
      setError("Email non valide");
      return;
    }

    const payload: CustomerUpdatePayload = {
      phone: trimmedPhone,
      ...(trimmedFirst ? { first_name: trimmedFirst } : {}),
      ...(trimmedLast ? { last_name: trimmedLast } : {}),
      ...(trimmedEmail ? { email: trimmedEmail } : {}),
    };

    try {
      await mutation.mutateAsync({ id: customer.id, payload });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Modifier le client</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Prénom
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nom
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/40"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-[#F17922] text-white text-sm font-semibold hover:bg-[#D8631F] disabled:opacity-60"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
