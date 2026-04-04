"use client";

import React, { useState, useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";
import {
  useCreateNewsMutation,
  useUpdateNewsMutation,
} from "../../../../features/news/queries/news.query";
import type { News } from "../../../../features/news/types/news.types";
import { formatImageUrl } from "@/utils/imageHelpers";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editItem?: News | null;
}

export default function NewsFormModal({ isOpen, onClose, editItem }: Props) {
  const createMutation = useCreateNewsMutation();
  const updateMutation = useUpdateNewsMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editItem;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setContent(editItem.content ?? "");
      setLink(editItem.link ?? "");
      setIsActive(editItem.isActive);
      setImageFile(null);
      setImagePreview(
        editItem.imageUrl ? formatImageUrl(editItem.imageUrl) : null
      );
    } else {
      resetForm();
    }
  }, [editItem, isOpen]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setLink("");
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    if (content) formData.append("content", content);
    if (link) formData.append("link", link);
    formData.append("isActive", String(isActive));
    if (imageFile) formData.append("image", imageFile);

    if (isEdit && editItem) {
      updateMutation.mutate(
        { id: editItem.id, formData },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Modifier la nouveauté" : "Nouvelle nouveauté"}
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image (ratio 2.5:1 recommandé)
          </label>
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "2.5 / 1" }}>
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#F17922] hover:bg-orange-50/30 transition-all cursor-pointer"
              style={{ aspectRatio: "2.5 / 1" }}
            >
              <Upload size={24} className="text-gray-400" />
              <span className="text-sm text-gray-500">
                Cliquer pour ajouter une image
              </span>
              <span className="text-[11px] text-gray-400">
                PNG, JPG — ratio 2.5:1 recommandé
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Titre *
          </label>
          <input
            type="text"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: Nouveau menu disponible !"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description (optionnel)
          </label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            placeholder="Détails de la nouveauté..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Lien (optionnel)
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Ex: chickennation://menu/... ou https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Deeplink interne (chickennation://...) ou URL externe
          </p>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Publier immédiatement</p>
            <p className="text-xs text-gray-400">
              Si désactivé, la nouveauté ne sera pas visible dans l'app
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
              isActive ? "bg-[#F17922]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-[#F17922] text-white rounded-xl text-sm font-semibold hover:bg-[#e06816] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
