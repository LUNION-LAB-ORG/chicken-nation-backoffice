import { motion } from "framer-motion";
export const InfoCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) => (
  <motion.div
    className="p-4 bg-gradient-to-br from-gray-50 to-white border-2 border-[#D9D9D9]/50 rounded-xl"
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex items-center gap-3">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-[#595959]">{value}</p>
      </div>
    </div>
  </motion.div>
);
