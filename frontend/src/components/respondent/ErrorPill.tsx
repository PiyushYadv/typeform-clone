import { motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";

export function ErrorPill({ message }: { message: string }) {
  return (
    <motion.div
      role="alert"
      className="tf-error"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <TriangleAlert size={16} aria-hidden />
      {message}
    </motion.div>
  );
}
