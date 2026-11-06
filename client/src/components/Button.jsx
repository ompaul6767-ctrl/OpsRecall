import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import clsx from "clsx";

export default function Button({ children, variant = "primary", className = "", loading = false, ...props }) {
  const variants = {
    primary: "shine-button border border-blue-700/10 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-[0_8px_26px_rgba(37,99,235,0.24)] hover:shadow-[0_10px_32px_rgba(37,99,235,0.34)]",
    secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50",
    subtle: "text-slate-500 hover:bg-blue-50 hover:text-blue-700",
    success: "shine-button border border-emerald-700 bg-emerald-700 text-white shadow-[0_8px_24px_rgba(16,185,129,0.18)] hover:bg-emerald-800 hover:shadow-[0_10px_30px_rgba(16,185,129,0.24)]",
  };
  return (
    <motion.button
      whileTap={{ scale: 0.975 }}
      transition={{ duration: 0.16 }}
      className={clsx("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white", variants[variant], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <LoaderCircle size={16} className="animate-spin" />}
      {children}
    </motion.button>
  );
}
