import { motion } from "framer-motion";

export const LevelCard = ({
  level,
  threshold,
  color,
}: {
  level: string;
  threshold: number;
  color: string;
}) => (
  <motion.div
    className="p-4 bg-white border-2 border-[#D9D9D9]/50 rounded-xl text-center"
    whileHover={{ scale: 1.05 }}
  >
    <div
      className={`w-12 h-12 ${color} rounded-full mx-auto mb-2 flex items-center justify-center`}
    >
      <span className="text-white text-xl font-bold">
        {level === "Gold" ? "👑" : level === "Premium" ? "⭐" : "🥉"}
      </span>
    </div>
    <h4 className="font-semibold text-gray-700 mb-1">{level}</h4>
    <p className="text-2xl font-bold text-[#F17922]">{threshold}</p>
    <p className="text-xs text-gray-500">points</p>
  </motion.div>
);
