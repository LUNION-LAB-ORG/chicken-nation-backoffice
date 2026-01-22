import { motion } from "framer-motion";

export const FormField = ({
  label,
  value,
  onChange,
  type = "text",
  step,
  min,
  placeholder,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  min?: string;
  placeholder?: string;
  helper?: string;
}) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-[#595959]">{label}</label>
    <motion.div
      className="px-3 py-3 border-2 border-[#D9D9D9]/50 rounded-xl focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
      whileHover={{ scale: 1.01 }}
    >
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        min={min}
        placeholder={placeholder}
        className="w-full focus:outline-none text-[#595959] font-medium"
      />
    </motion.div>
    {helper && <p className="text-xs text-gray-500">{helper}</p>}
  </div>
);