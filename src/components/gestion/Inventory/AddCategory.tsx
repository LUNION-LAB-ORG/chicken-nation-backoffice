"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Textarea from "@/components/ui/textarea";
// import { Loader2 } from 'lucide-react' // Import non utilisé
import { createCategory, updateCategory, Category } from "@/services";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import Checkbox from "@/components/ui/Checkbox";

interface AddCategoryProps {
  onCancel: () => void;
  onSuccess?: (category: Category) => void;
  category?: Category | null;
}

export default function AddCategory({
  onCancel,
  onSuccess,
  category,
}: AddCategoryProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: undefined as File | undefined,
    private: false,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, accessToken } = useAuthStore();

  useEffect(() => {
    try {
      const authData = localStorage.getItem("chicken-nation-auth");
      if (authData) {
        // const parsedData = JSON.parse(authData); // Variable non utilisée actuellement
        // const localStorageToken = parsedData?.state?.accessToken; // Variable non utilisée
      } else {
        console.log("Aucune donnée d'authentification dans le localStorage");
      }
    } catch (error) {
      console.error("Erreur lors de la lecture du localStorage:", error);
    }
  }, [accessToken]);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        image: undefined,
        private: category.private,
      });

      if (category.image) {
        setImagePreview(category.image);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        image: undefined,
      }));
      setImagePreview(null);
    }
  }, [category]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));

      // Créer une URL pour la prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Vérifier si l'utilisateur est connecté
    if (!isAuthenticated) {
      toast.error("Vous devez être connecté pour effectuer cette action");
      setIsLoading(false);
      return;
    }

    try {
      let savedCategory: Category;

      // Créer un FormData pour l'envoi des données
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("description", formData.description);
      fd.append("private", String(formData.private));

      // Ajouter l'image si elle existe
      if (formData.image) {
        fd.append("image", formData.image);
      }

      if (category?.id) {
        // Mise à jour d'une catégorie existante
        fd.append("id", category.id);
        savedCategory = await updateCategory(category.id, fd);
        toast.success("Catégorie mise à jour avec succès");
      } else {
        // Création d'une nouvelle catégorie
        savedCategory = await createCategory(fd);
        toast.success("Catégorie créée avec succès");
      }

      if (onSuccess) {
        onSuccess(savedCategory);
      }
      onCancel();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la catégorie:", error);

      if (error instanceof Error) {
        if (error.message.includes("Authentication required")) {
          toast.error("Authentification requise. Veuillez vous reconnecter.");
        } else {
          toast.error(`Erreur: ${error.message}`);
        }
      } else {
        toast.error(
          "Une erreur est survenue lors de la sauvegarde de la catégorie"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-6 items-center">
        {/* Section de téléchargement d'image */}
        <div className="w-[180px] flex-shrink-0">
          <div
            className="w-full aspect-square border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            {imagePreview ? (
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Aperçu de la catégorie"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <>
                <Image
                  src="/icons/image.png"
                  alt="Aperçu de la catégorie"
                  width={40}
                  height={40}
                  className="w-8 mb-2 h-8 object-contain"
                />
                <p className="text-[14px] text-[#a1a1aa]   text-center px-2">
                  Télécharger une image ici
                </p>
              </>
            )}
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* Formulaire */}
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-[13px] text-gray-600 mb-1">
              Nom de la catégorie*
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nom de la catégorie"
              required
              disabled={isLoading}
              className="w-full h-[42px] rounded-xl bg-white border border-[#D8D8D8] px-4 text-[13px] placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-[13px] text-gray-600 mb-1">
              Description
            </label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="À propos de cette catégorie"
              rows={4}
              disabled={isLoading}
              className="w-full rounded-xl bg-white border border-[#D8D8D8] px-4 py-3 text-[13px] placeholder-gray-400 resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="private"
              checked={formData.private}
              onChange={(checked) => {
                setFormData((prev) => ({
                  ...prev,
                  private: checked,
                }));
              }}
            />
            <label className="block text-[13px] text-gray-600 mb-1">
              Privée
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button
          type="button"
          onClick={onCancel}
          className="h-[32px] cursor-pointer text-[#9796A1] px-12 rounded-[10px] bg-[#ECECEC] text-[13px] items-center justify-center hover:bg-gray-100 min-w-[160px]"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="h-[32px] cursor-pointer px-12 rounded-[10px] bg-[#F17922] hover:bg-[#F17922]/90 text-white text-[13px] min-w-[160px] lg:min-w-[280px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? "Enregistrement..."
            : category
            ? "Mettre à jour"
            : "Ajouter une catégorie"}
        </Button>
      </div>
    </form>
  );
}
