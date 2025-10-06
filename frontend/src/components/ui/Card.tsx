import { motion } from "framer-motion";
import React from "react";
export function Card({ title, icon, className = "", children }:{
  title?: string; icon?: React.ReactNode; className?: string; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className={`rounded-2xl bg-white/70 backdrop-blur border border-slate-200 shadow-sm p-5 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-700 font-medium">{title}</h3>
          <div className="text-slate-400">{icon}</div>
        </div>
      )}
      {children}
    </motion.div>
  );
}
