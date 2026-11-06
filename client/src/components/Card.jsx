import { motion } from "framer-motion";
import clsx from "clsx";

export default function Card({ children, className = "", interactive = false, ...props }) {
  return (
    <motion.section
      className={clsx("glass-card rounded-2xl", className)}
      whileHover={interactive ? { y: -3, transition: { duration: 0.2 } } : undefined}
      {...props}
    >
      {children}
    </motion.section>
  );
}
