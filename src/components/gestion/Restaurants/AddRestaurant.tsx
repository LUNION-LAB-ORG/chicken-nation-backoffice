"use client";

import Toggle from "@/components/ui/Toggle";
import { validateCreateRestaurant } from "@/schemas/restaurantSchemas";
import {
  createRestaurant,
  createRestaurantJSON,
  getRestaurantManager,
  Restaurant,
  Schedule,
  updateRestaurant,
} from "@/services/restaurantService";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../ui/Button";
import Input from "../../ui/Input";
import ManagerCredentialsCustomModal from "./ManagerCredentialsCustomModal";
import RestaurantMap from "./RestaurantMap";
import ScheduleSelector from "./ScheduleSelector";

interface ManagerCredentials {
  email: string;
  password: string;
}

interface AddRestaurantProps {
  onCancel: () => void;
  onSuccess?: (restaurant: Restaurant) => void;
  restaurant?: Restaurant | null;
}

export default function AddRestaurant({
  onCancel,
  onSuccess,
  restaurant,
}: AddRestaurantProps) {
  // État pour stocker les données du formulaire
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    phone: string;
    email: string;
    schedule: Schedule[];
    managerFullname: string;
    managerEmail: string;
    managerPhone: string;
    imageFile?: File;
    image?: string;
    active: boolean;
  }>({
    name: "",
    description: "",
    address: "",
    latitude: 0,
    longitude: 0,
    phone: "",
    email: "",
    schedule: [
      { "1": "08:00-22:00" },
      { "2": "08:00-22:00" },
      { "3": "08:00-22:00" },
      { "4": "08:00-22:00" },
      { "5": "08:00-22:00" },
      { "6": "08:00-22:00" },
      { "7": "08:00-22:00" },
    ],
    managerFullname: "",
    managerEmail: "",
    managerPhone: "",
    active: true,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  // const [isLoadingManager, setIsLoadingManager] = useState(false) // Variable non utilisée
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [managerCredentials, setManagerCredentials] =
    useState<ManagerCredentials | null>(null);

  // Fonction pour charger les détails du manager
  const fetchManagerDetails = async (restaurantId: string) => {
    // setIsLoadingManager(true); // Variable non utilisée
    try {
      const managerData = await getRestaurantManager(restaurantId);

      if (managerData) {
        setFormData((prev) => ({
          ...prev,
          managerFullname: managerData.fullname || "",
          managerEmail: managerData.email || "",
          managerPhone: (managerData as { phone?: string }).phone || "",
        }));
      }
    } catch (error: unknown) {
      console.error("Erreur lors du chargement des détails du manager:", error);
    } finally {
      // setIsLoadingManager(false); // Variable non utilisée
    }
  };

  // Initialiser le formulaire si un restaurant est fourni pour modification
  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name,
        description: restaurant.description,
        address: restaurant.address,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        phone: restaurant.phone,
        email: restaurant.email,
        schedule: restaurant.schedule,
        managerFullname: restaurant.managerFullname || "",
        managerEmail: restaurant.managerEmail || "",
        managerPhone: restaurant.managerPhone || "",
        active: restaurant.active || true,
      });

      if (restaurant.image) {
        if (restaurant.image.startsWith("http")) {
          setImagePreview(restaurant.image);
        } else {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

          const imageUrl = restaurant.image.startsWith("/")
            ? restaurant.image
            : `/${restaurant.image}`;
          setImagePreview(`${apiUrl}${imageUrl}`);
        }
      }

      if (restaurant.id) {
        fetchManagerDetails(restaurant.id);
      }
    }
  }, [restaurant]);

  const validateForm = () => {
    try {
      // ✅ SÉCURITÉ: Validation avec Zod
      const validationData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        address: formData.address.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        schedule: formData.schedule,
        active: formData.active,
        // Données du gérant (uniquement pour création)
        ...(!restaurant?.id && {
          managerFullname: formData.managerFullname.trim(),
          managerEmail: formData.managerEmail.trim(),
          managerPhone: formData.managerPhone.trim(),
        }),
      };

      validateCreateRestaurant(validationData);
      setFormErrors({});
      return true;
    } catch (error: unknown) {
      const errors: { [key: string]: string } = {};

      if (error && typeof error === "object" && "errors" in error) {
        // Erreurs Zod
        const zodError = error as {
          errors: Array<{ path: Array<string | number>; message: string }>;
        };
        zodError.errors.forEach((err) => {
          const field = err.path[0];
          if (field && typeof field === "string" && !errors[field]) {
            errors[field] = err.message;
          }
        });
      } else {
        errors.general = "Données invalides";
      }

      setFormErrors(errors);
      return false;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "latitude" || name === "longitude") {
      const isValidInput = /^-?\d*\.?\d*$/.test(value);

      if (isValidInput || value === "") {
        const numValue = value === "" ? 0 : parseFloat(value) || 0;

        setFormData((prev) => ({
          ...prev,
          [name]: numValue,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleToggleChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
      }));
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScheduleChange = (schedule: Schedule[]) => {
    setFormData((prev) => ({
      ...prev,
      schedule,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setIsLoading(true);

    try {
      const latitude = parseFloat(formData.latitude.toString());
      const longitude = parseFloat(formData.longitude.toString());

      if (isNaN(latitude) || isNaN(longitude)) {
        toast.error(
          "Les coordonnées géographiques doivent être des nombres valides"
        );
        setIsLoading(false);
        return;
      }

      if (restaurant?.id) {
        const fd = new FormData();
        fd.append("name", formData.name);
        fd.append("description", formData.description);
        fd.append("address", formData.address);
        fd.append("latitude", latitude.toString());
        fd.append("longitude", longitude.toString());
        fd.append("phone", formData.phone);
        fd.append("email", formData.email);
        fd.append("schedule", JSON.stringify(formData.schedule));
        fd.append("active", formData.active ? "true" : "false");

        if (formData.imageFile) {
          fd.append("image", formData.imageFile);
        }

        const result = await updateRestaurant(restaurant.id, fd);
        toast.success("Restaurant mis à jour avec succès");

        if (onSuccess) onSuccess(result);
        onCancel();
      } else {
        const restaurantData = {
          name: formData.name,
          description: formData.description,
          address: formData.address,
          latitude: latitude, // Déjà converti en nombre
          longitude: longitude, // Déjà converti en nombre
          phone: formData.phone,
          email: formData.email,
          schedule: formData.schedule,
          active: formData.active,
          managerFullname: formData.managerFullname,
          managerEmail: formData.managerEmail,
          managerPhone: formData.managerPhone,
        };

        // Si nous avons une image, utiliser FormData
        if (formData.imageFile) {
          const fd = new FormData();

          // Ajouter toutes les propriétés à FormData
          Object.entries(restaurantData).forEach(([key, value]) => {
            if (key === "schedule") {
              fd.append(key, JSON.stringify(value));
            } else if (key === "latitude" || key === "longitude") {
              fd.append(key, value.toString());
            } else if (key === "active") {
              fd.append(key, value ? "true" : "false");
            } else {
              fd.append(key, value as string);
            }
          });

          // Ajouter l'image
          fd.append("image", formData.imageFile);

          try {
            const result = await createRestaurant(fd);

            if (
              result &&
              result.manager &&
              typeof result.manager === "object" &&
              result.manager.email &&
              result.manager.password
            ) {
              setManagerCredentials({
                email: result.manager.email,
                password: result.manager.password,
              });
              setShowCredentialsModal(true);

              if (onSuccess) onSuccess(result);
            } else {
              toast.success("Restaurant créé avec succès");
              if (onSuccess) onSuccess(result);
              onCancel();
            }
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Impossible de créer le restaurant";
            toast.error(`Erreur: ${errorMessage}`);
            setIsLoading(false);
          }
        } else {
          // Sinon, utiliser JSON directement
          try {
            const result = await createRestaurantJSON(restaurantData);

            if (
              result &&
              result.manager &&
              typeof result.manager === "object" &&
              result.manager.email &&
              result.manager.password
            ) {
              setManagerCredentials({
                email: result.manager.email,
                password: result.manager.password,
              });
              setShowCredentialsModal(true);

              if (onSuccess) onSuccess(result);
            } else {
              toast.success("Restaurant créé avec succès");
              if (onSuccess) onSuccess(result);
              onCancel();
            }
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Impossible de créer le restaurant";
            toast.error(`Erreur: ${errorMessage}`);
            setIsLoading(false);
          }
        }
      }
    } catch (error: unknown) {
      console.error("Erreur lors de la mise à jour du restaurant:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Impossible de traiter le restaurant";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-y-auto max-h-[82vh] px-4 pb-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Informations générales */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Informations générales</h3>
          {/* Nom */}
          <div>
            <label className="block text-sm text-[#595959] font-light mb-2">
              Nom du restaurant
            </label>
            <Input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Nom du restaurant"
              className={`w-full h-[42px] rounded-xl bg-white border ${
                formErrors.name ? "border-red-500" : "border-[#D8D8D8]"
              } px-4 text-[13px] text-gray-700 dark:text-gray-700 placeholder-gray-400 dark:placeholder-gray-400`}
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm text-[#595959] font-light mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description du restaurant"
              rows={3}
              className={`w-full rounded-xl bg-white border ${
                formErrors.description ? "border-red-500" : "border-[#D8D8D8]"
              } px-4 py-2 text-[13px] text-gray-700 dark:text-gray-700 placeholder-gray-400 dark:placeholder-gray-400`}
            />
            {formErrors.description && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.description}
              </p>
            )}
          </div>
          {/* Carte */}
          <div>
            <label className="block text-sm text-[#595959] font-light mb-2">
              Localisation
            </label>
            <RestaurantMap
              initialLat={formData.latitude}
              initialLng={formData.longitude}
              onLocationChange={(lat, lng, address) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                  address: address,
                }));
              }}
            />
          </div>
          Photo
          <div>
            <label className="block text-sm text-[#595959] font-light mb-2">
              Photo du restaurant
            </label>
            <div
              className="w-full h-[170px] border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() =>
                document.getElementById("restaurant-image-upload")?.click()
              }
            >
              {imagePreview ? (
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Aperçu du restaurant"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                  <p className="text-[11px] text-gray-500 text-center px-2">
                    Télécharger une image ici
                  </p>
                </>
              )}
              <input
                type="file"
                id="restaurant-image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                aria-label="Télécharger une photo du restaurant"
              />
            </div>
          </div>
        </div>

        {/* Informations du gérant et horaires */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Informations du gérant</h3>

          {/* Nom du gérant */}
          <div>
            <label className="block text-sm text-[#595959] font-light mb-2">
              Nom complet du gérant
            </label>
            <Input
              name="managerFullname"
              type="text"
              value={formData.managerFullname}
              onChange={handleChange}
              required
              placeholder="Nom et prénom"
              className={`w-full h-[42px] rounded-xl bg-white border ${
                formErrors.managerFullname
                  ? "border-red-500"
                  : "border-[#D8D8D8]"
              } px-4 text-[13px] text-gray-700 dark:text-gray-700 placeholder-gray-400 dark:placeholder-gray-400`}
            />
            {formErrors.managerFullname && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.managerFullname}
              </p>
            )}
          </div>

          {/* Contact du gérant */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[#595959] font-light mb-2">
                Email du gérant
              </label>
              <Input
                name="managerEmail"
                type="email"
                value={formData.managerEmail}
                onChange={handleChange}
                required
                placeholder="email@gerant.com"
                className={`w-full h-[42px] rounded-xl bg-white border ${
                  formErrors.managerEmail
                    ? "border-red-500"
                    : "border-[#D8D8D8]"
                } px-4 text-[13px] text-gray-700 dark:text-gray-700 placeholder-gray-400 dark:placeholder-gray-400`}
              />
              {formErrors.managerEmail && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.managerEmail}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-[#595959] font-light mb-2">
                Téléphone du gérant
              </label>
              <Input
                name="managerPhone"
                type="text"
                value={formData.managerPhone}
                onChange={handleChange}
                required
                placeholder="+225 XX XX XX XX"
                className={`w-full h-[42px] rounded-xl bg-white border ${
                  formErrors.managerPhone
                    ? "border-red-500"
                    : "border-[#D8D8D8]"
                } px-4 text-[13px] text-gray-700 dark:text-gray-700 placeholder-gray-400 dark:placeholder-gray-400`}
              />
              {formErrors.managerPhone && (
                <p className="text-red-500 text-xs mt-1">
                  {formErrors.managerPhone}
                </p>
              )}
            </div>
          </div>

          {/* Horaires */}
          <div className="mt-6">
            <ScheduleSelector
              schedule={formData.schedule}
              onChange={handleScheduleChange}
            />
          </div>
          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[#595959] dark:text-gray-700 font-light mb-2">
                Téléphone
              </label>
              <Input
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+225 XX XX XX XX"
                className={`w-full h-[42px] rounded-xl bg-white border ${
                  formErrors.phone ? "border-red-500" : "border-[#D8D8D8]"
                } px-4 text-[13px] text-gray-700 dark:text-gray-700 placeholder-gray-400 dark:placeholder-gray-400`}
              />
              {formErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-[#595959] font-light mb-2">
                Email
              </label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="email@restaurant.com"
                className={`w-full h-[42px] rounded-xl bg-white border ${
                  formErrors.email ? "border-red-500" : "border-[#D8D8D8]"
                } px-4 text-[13px] text-gray-700 dark:text-gray-700 placeholder-gray-400 dark:placeholder-gray-400`}
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Actif/Inactif */}
            <div className="mt-3 w-full">
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Restaurant actif
                </span>
                <Toggle
                  checked={formData.active || false}
                  onChange={(checked) => handleToggleChange("active", checked)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button
          type="button"
          onClick={onCancel}
          className="h-[32px] text-[#9796A1] px-12 rounded-[10px] bg-[#ECECEC] text-[13px] items-center justify-center hover:bg-gray-100 min-w-[160px]"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="h-[32px] px-12 rounded-[10px] bg-[#F17922] hover:bg-[#F17922]/90 text-white text-[13px] min-w-[160px] lg:min-w-[280px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? "Traitement en cours..."
            : restaurant
            ? "Modifier le restaurant"
            : "Ajouter un restaurant"}
        </Button>
      </div>

      {/* ✅ MODAL CUSTOM POUR AFFICHER LES IDENTIFIANTS DU MANAGER CRÉÉ */}
      <ManagerCredentialsCustomModal
        open={showCredentialsModal}
        email={managerCredentials?.email || ""}
        password={managerCredentials?.password || ""}
        onClose={() => {
          setShowCredentialsModal(false);
          onCancel();
        }}
      />
    </form>
  );
}
