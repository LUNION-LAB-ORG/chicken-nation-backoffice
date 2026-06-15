"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import UserCredentialsModal from "./UserCredentialsModal";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import {
  getHumanReadableError,
  getPersonnelSuccessMessage,
  getInfoMessage,
} from "@/utils/errorMessages";
import { validateCreateUser } from "@/schemas/personnelSchemas";
import { createMember, createUser } from "../../../../features/users/services/user.service";
import { getAllRestaurants, Restaurant } from "@/services/restaurantService";

// Rôles « point de vente » : ils exigent un restaurant de rattachement.
const STORE_ROLES = ["MANAGER", "ASSISTANT_MANAGER", "CAISSIER", "CUISINE"];

interface CreatedMember {
  id: string;
  email: string;
  password: string;
  fullname: string;
  role: string;
  type: string;
  restaurant_id?: string;
}

interface AddMemberProps {
  onCancel: () => void;
  onSuccess?: (member: CreatedMember) => void;
}

export default function AddMember({ onCancel, onSuccess }: AddMemberProps) {
  const { user: currentUser } = useAuthStore();
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    address: "",
    image: undefined as File | undefined,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [role, setRole] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  // Sélection du restaurant (admin créant un rôle point de vente).
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  // ✅ PERFORMANCE: Mémoriser les options de rôle pour éviter les re-renders
  const roleOptions = useMemo(() => {
    // Admin : TOUS les rôles (backoffice + point de vente).
    // Manager restaurant : uniquement le staff de son restaurant.
    if (currentUser?.role === "ADMIN") {
      return [
        { value: "ADMIN", label: "ADMINISTRATEUR" },
        { value: "MARKETING", label: "MARKETING" },
        { value: "COMPTABLE", label: "COMPTABLE" },
        { value: "CALL_CENTER", label: "CALL CENTER" },
        { value: "MANAGER", label: "MANAGER" },
        { value: "ASSISTANT_MANAGER", label: "ASSISTANT MANAGER" },
        { value: "CAISSIER", label: "CAISSIER" },
        { value: "CUISINE", label: "CUISINE" },
      ];
    }
    return [
      { value: "ASSISTANT_MANAGER", label: "ASSISTANT MANAGER" },
      { value: "CAISSIER", label: "CAISSIER" },
      { value: "CUISINE", label: "CUISINE" },
    ];
  }, [currentUser?.role]);

  // Un rôle point de vente exige un restaurant. L'admin le choisit ; le manager
  // crée pour SON restaurant (rattachement automatique).
  const isStoreRole = STORE_ROLES.includes(role);
  const isManager = currentUser?.role === "MANAGER";
  const needsRestaurantPicker = isStoreRole && currentUser?.role === "ADMIN";
  const resolvedRestaurantId = isManager
    ? currentUser?.restaurant_id || undefined
    : needsRestaurantPicker
      ? restaurantId || undefined
      : undefined;
  const memberType: "BACKOFFICE" | "RESTAURANT" = isStoreRole
    ? "RESTAURANT"
    : "BACKOFFICE";

  // Charger les restaurants (pour le sélecteur admin).
  useEffect(() => {
    let active = true;
    getAllRestaurants()
      .then((list) => {
        if (active) setRestaurants(list.filter((r) => r.active));
      })
      .catch(() => {
        /* non bloquant : le sélecteur sera vide */
      });
    return () => {
      active = false;
    };
  }, []);

  // Définir le rôle par défaut
  useEffect(() => {
    if (roleOptions.length > 0 && !role) {
      setRole(roleOptions[0].value);
    }
  }, [roleOptions, role]);

  // ✅ SÉCURITÉ: Log au montage du composant
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("=== Modal AddMember ouvert ===");
      console.log("Current User:", currentUser);
      console.log("User Type:", currentUser?.type);
      console.log("User Role:", currentUser?.role);
      console.log("Raw User Data:", JSON.stringify(currentUser, null, 2));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!showRoleDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRoleDropdown]);

  const validateForm = (): boolean => {
    if (isStoreRole && !resolvedRestaurantId) {
      toast.error("Sélectionnez un restaurant pour ce rôle (point de vente).");
      return false;
    }
    try {
      // ✅ SÉCURITÉ: Validation avec Zod
      const validationData = {
        fullname: formData.fullname.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        role: role,
        type: memberType,
        restaurant_id: resolvedRestaurantId,
        active: true,
      };

      validateCreateUser(validationData);
      return true;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "errors" in error) {
        // Erreurs Zod
        const zodError = error as { errors: Array<{ message: string }> };
        const firstError = zodError.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Données invalides");
      }
      return false;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  function getImagePreviewUrl() {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!imagePreview) return "/icons/avatar.png";
    if (imagePreview.startsWith("blob:") || imagePreview.startsWith("data:"))
      return imagePreview;
    if (imagePreview.startsWith("http")) return imagePreview;
    return `${API_BASE_URL}/${imagePreview}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    // Toast de chargement
    toast.loading(getInfoMessage("saving"));

    try {
      const userObj: {
        fullname: string;
        email: string;
        phone: string;
        address: string;
        role: string;
        type: "BACKOFFICE" | "RESTAURANT";
        image?: File;
        restaurant_id?: string;
      } = {
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        role: role,
        type: memberType,
        image: formData.image,
      };

      // Rôle point de vente → rattachement à un restaurant (choisi par l'admin,
      // ou celui du manager). Le backend revérifie (resolveStaffType).
      if (resolvedRestaurantId) {
        userObj.restaurant_id = resolvedRestaurantId;
      }
      if (process.env.NODE_ENV === "development") {
        console.log("Données envoyées au backend:", userObj);
      }

      try {
        let created;
        // Si c'est un manager qui crée un membre, utiliser l'endpoint spécifique /users/member
        if (currentUser?.role === "MANAGER") {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "🎯 Manager détecté - Utilisation de l'endpoint /users/member"
            );
          }
          created = await createMember(userObj);
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "🎯 Admin détecté - Utilisation de l'endpoint /users normal"
            );
          }
          created = await createUser(userObj);
        }

        setIsLoading(false);
        if (process.env.NODE_ENV === "development") {
          console.log("Utilisateur créé:", created);
        }
        toast.success(getPersonnelSuccessMessage("create"));
        setCreatedUserCredentials({
          email: created.email,
          password:
            (created as CreatedMember).password ||
            "Mot de passe non disponible",
        });
        setShowCredentialsModal(true);
      } catch (error: unknown) {
        setIsLoading(false);
        const userMessage = getHumanReadableError(error);
        toast.error(userMessage);
      }
      return;
    } catch (error) {
      setIsLoading(false);
      const userMessage = getHumanReadableError(error);
      toast.error(userMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[760px] mx-0 md:mx-0 p-0 max-h-[92vh] overflow-y-auto">
        <div className="relative flex items-center justify-center px-0 pt-0 pb-0 bg-[#FFF3E3] rounded-t-2xl h-[40px]">
          <h2 className="text-base font-semibold text-[#F17922] mx-auto text-center">
            Créer un membre
          </h2>
          <Image
            src="/icons/close.png"
            width={20}
            height={20}
            alt="Fermer"
            onClick={onCancel}
            className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-4xl font-bold"
          />
        </div>
        <form onSubmit={handleSubmit} className="block md:hidden w-full">
          <div className="px-4 pt-6 pb-4 flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <div
                className="w-[96px] h-[96px] rounded-full bg-[#F4F4F5] flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() =>
                  document.getElementById("member-image-upload")?.click()
                }
              >
                <Image
                  src={getImagePreviewUrl()}
                  alt="Aperçu du membre"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full rounded-full"
                  unoptimized
                />
                <input
                  id="member-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  aria-label="Télécharger une photo de profil"
                />
              </div>
              <button
                type="button"
                className="text-[#F17922] text-xs font-semibold mt-1"
                onClick={() =>
                  document.getElementById("member-image-upload")?.click()
                }
              >
                Changer la photo
              </button>
            </div>
            <Input
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              placeholder="Nom complet"
              required
              className="h-[44px] rounded-lg border border-[#ECECEC] bg-white text-[15px] px-4 placeholder-[#D8D8D8] focus:ring-2 focus:ring-[#F17922]/30 mb-1"
            />
            <Input
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Adresse email"
              className="h-[44px] rounded-lg border border-[#ECECEC] bg-white text-[15px] px-4 placeholder-[#D8D8D8] focus:ring-2 focus:ring-[#F17922]/30 mb-1"
            />
            <Input
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              placeholder="Numéro de téléphone"
              className="h-[44px] rounded-lg border border-[#ECECEC] bg-white text-[15px] px-4 placeholder-[#D8D8D8] focus:ring-2 focus:ring-[#F17922]/30 mb-1"
            />
            <Input
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              placeholder="Adresse"
              className="h-[44px] rounded-lg border border-[#ECECEC] bg-white text-[15px] px-4 placeholder-[#D8D8D8] focus:ring-2 focus:ring-[#F17922]/30 mb-1"
            />
            <div className="relative">
              <div className="text-[#595959] text-[15px] font-normal mb-1">
                Rôle
              </div>
              <div
                className="flex items-center border border-[#ECECEC] rounded-lg bg-white px-4 h-[44px] cursor-pointer select-none"
                onClick={() => setShowRoleDropdown((v) => !v)}
              >
                <span className="flex-1 text-[#71717A] text-[15px] font-semibold">
                  {roleOptions.find((opt) => opt.value === role)?.label ||
                    "Choisissez un rôle"}
                </span>
                <span className="text-[#F17922] font-bold text-xl">›</span>
              </div>
              {showRoleDropdown && (
                <div className="absolute left-0 right-0 z-20 bg-white rounded-xl shadow-lg border border-[#ECECEC] mt-1">
                  {roleOptions.map((option) => (
                    <div
                      key={option.value}
                      className="px-4 py-2 text-[15px] text-[#232323] hover:bg-[#FFF3E3] hover:text-[#F17922] cursor-pointer rounded-xl"
                      onMouseDown={() => {
                        setRole(option.value);
                        setShowRoleDropdown(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {needsRestaurantPicker && (
              <div>
                <div className="text-[#595959] text-[15px] font-normal mb-1">
                  Restaurant
                </div>
                <select
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  className="w-full h-[44px] rounded-lg border border-[#ECECEC] bg-white px-4 text-[15px] text-[#71717A] focus:ring-2 focus:ring-[#F17922]/30"
                >
                  <option value="">Choisissez un restaurant</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-2 mt-4">
              <Button
                type="button"
                onClick={onCancel}
                className="h-[40px] cursor-pointer text-[#9796A1] rounded-lg bg-[#ECECEC] text-[15px] items-center justify-center hover:bg-gray-100 w-full"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-[40px] cursor-pointer rounded-lg bg-[#F17922] hover:bg-[#F17922]/90 text-white text-[15px] w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </form>
        <form
          onSubmit={handleSubmit}
          className="hidden md:flex md:flex-col px-0 pt-0 pb-0 gap-0 min-w-[600px]"
        >
          <div className="px-12 pt-5">
            <span className="text-xs text-[#F17922] font-semibold">
              Informations basiques
            </span>
          </div>
          <div className="flex flex-row items-center justify-between px-12 pt-3 pb-2 w-full gap-3">
            <span className="text-[15px] text-[#71717A] font-medium">
              Photo de profil
            </span>
            <div className="flex items-center gap-3">
              <div
                className="w-[88px] h-[88px]  bg-[#F4F4F5]  rounded-full flex flex-col items-center justify-center
                cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden"
                onClick={() =>
                  document
                    .getElementById("member-image-upload-desktop")
                    ?.click()
                }
              >
                <Image
                  src={getImagePreviewUrl()}
                  alt="Aperçu du membre"
                  width={88}
                  height={88}
                  className="object-cover w-full h-full rounded-full"
                  unoptimized
                />
                <input
                  id="member-image-upload-desktop"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  aria-label="Télécharger une photo de profil"
                />
              </div>
              <span
                className="text-[15px] text-[#9796A1] font-normal ml-2 cursor-pointer select-none"
                onClick={() =>
                  document
                    .getElementById("member-image-upload-desktop")
                    ?.click()
                }
              >
                Télécharger une image
              </span>
            </div>
            <div className="w-32" />
          </div>
          <div className="flex flex-col gap-0 px-12">
            <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px]">
              <label className="text-[#71717A] w-[160px] text-[15px] font-normal">
                Nom et prénom(s)
              </label>
              <Input
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                placeholder="Nom complet"
                required
                className="h-[40px] rounded-none  font-bold border-none bg-transparent text-[15px] placeholder-[#D8D8D8] focus:ring-0
                focus:border-none ml-2"
                style={{ width: "520px", maxWidth: "100%" }}
              />
            </div>
            {/* Email */}
            <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px]">
              <label className="text-[#71717A] w-[160px] text-[15px] font-normal">
                E-mail
              </label>
              <Input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Créez une adresse mail"
                className="h-[40px] rounded-none font-bold border-none bg-transparent text-[15px] placeholder-[#D8D8D8]  text-slate-700  focus:ring-0 focus:border-none ml-2"
                style={{ width: "520px", maxWidth: "100%" }}
              />
            </div>
            {/* Téléphone */}
            <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px]">
              <label className="text-[#71717A] w-[160px] text-[15px] font-normal">
                Téléphone
              </label>
              <Input
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                placeholder="Numéro de téléphone"
                className="h-[40px] rounded-none  font-bold border-none bg-transparent text-[15px] placeholder-[#D8D8D8]  text-slate-700  focus:ring-0 focus:border-none ml-2"
                style={{ width: "520px", maxWidth: "100%" }}
              />
            </div>
            {/* Adresse */}
            <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px]">
              <label className="text-[#71717A] w-[160px] text-[15px] font-normal">
                Adresse
              </label>
              <Input
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                placeholder="Ajouter une adresse"
                className="h-[40px] font-bold rounded-none border-none bg-transparent text-[15px] placeholder-[#D8D8D8] text-slate-700 focus:ring-0 focus:border-none ml-2"
                style={{ width: "520px", maxWidth: "100%" }}
              />
            </div>
          </div>
          {/* Contrôle du compte */}
          <div className="px-12 pt-6 pb-1">
            <span className="text-xs text-[#F17922] font-semibold">
              Contrôle du compte
            </span>
          </div>
          <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px] px-12">
            <label className="text-[#595959] w-[160px] text-[15px] font-normal">
              Rôle
            </label>
            <div
              className="flex-1 flex items-center relative"
              ref={roleDropdownRef}
            >
              <div
                className="ml-2 text-[#71717A] text-[15px] font-semibold cursor-pointer select-none bg-transparent outline-none border-none focus:ring-0
                 focus:outline-none min-w-[220px] max-w-[300px] h-[40px] flex items-center"
                onClick={() => setShowRoleDropdown((v) => !v)}
              >
                {roleOptions.find((opt) => opt.value === role)?.label ||
                  "Choisissez un rôle"}
              </div>
              {showRoleDropdown && (
                <div className="absolute top-full left-0 z-20 bg-white rounded-xl shadow-lg border border-[#ECECEC] min-w-[220px] max-w-[300px] mt-1">
                  {roleOptions.map((option) => (
                    <div
                      key={option.value}
                      className="px-4 py-2 text-[15px] text-[#232323] hover:bg-[#FFF3E3] hover:text-[#F17922] cursor-pointer rounded-xl"
                      onMouseDown={() => {
                        setRole(option.value);
                        setShowRoleDropdown(false);
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[#71717A] font-bold text-2xl ml-2">›</span>
          </div>
          {needsRestaurantPicker && (
            <div className="flex flex-row items-center border-b border-[#ECECEC] h-[54px] px-12">
              <label className="text-[#595959] w-[160px] text-[15px] font-normal">
                Restaurant
              </label>
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="ml-2 flex-1 bg-transparent text-[#71717A] text-[15px] font-semibold outline-none h-[40px] cursor-pointer"
              >
                <option value="">Choisissez un restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Boutons */}
          <div className="flex justify-end gap-3 mt-6 px-12 pb-6">
            <Button
              type="button"
              onClick={onCancel}
              className="h-[32px] cursor-pointer text-[#9796A1] px-12 rounded-[10px] bg-[#ECECEC] text-[13px] items-center
              justify-center hover:bg-gray-100 min-w-[120px]"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-[32px] cursor-pointer px-12 rounded-[10px] bg-[#F17922] hover:bg-[#F17922]/90 text-white
              text-[13px] min-w-[230px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
      <UserCredentialsModal
        open={showCredentialsModal}
        email={createdUserCredentials?.email || ""}
        password={createdUserCredentials?.password || ""}
        onClose={() => {
          setShowCredentialsModal(false);
          if (onSuccess && createdUserCredentials) {
            // Créer un objet CreatedMember complet avec les données disponibles
            const memberData: CreatedMember = {
              id: "temp-id", // ID temporaire car pas disponible dans les credentials
              email: createdUserCredentials.email,
              password: createdUserCredentials.password,
              fullname: formData.fullname,
              role: role,
              type: memberType,
              restaurant_id: resolvedRestaurantId,
            };
            onSuccess(memberData);
          }
        }}
      />
    </div>
  );
}
