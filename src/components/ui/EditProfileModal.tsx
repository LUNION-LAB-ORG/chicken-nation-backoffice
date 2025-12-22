"use client";

import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import EditMember from "@/components/gestion/Personnel/EditMember";
import { User } from "@/services/userService";

interface EditProfileModalProps {
  isOpen: boolean;
}

export default function EditProfileModal({ isOpen }: EditProfileModalProps) {
  const { user, setUser } = useAuthStore();
  const { setShowEditProfile } = useUIStore();

  if (!isOpen || !user) return null;

  const handleSuccess = (updatedUser: User) => {
    setUser(updatedUser);
    setShowEditProfile(false);
  };

  return (
    <EditMember
      existingMember={{
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        type: user.type,
        image: user.image || undefined,
        phone: user.phone || "",
        address: user.address || "",
        entity_status: user.entity_status as
          | "NEW"
          | "ACTIVE"
          | "INACTIVE"
          | "DELETED"
          | undefined,
        restaurant: user.restaurant_id || undefined,
        restaurant_id: user.restaurant_id || undefined,
        created_at: user.created_at,
        updated_at: user.updated_at,
        password_is_updated: user.password_is_updated,
      }}
      onCancel={() => setShowEditProfile(false)}
      onSuccess={handleSuccess}
    />
  );
}
