import React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

export default function PageTransition({ children, fullHeight = false }) {
  return (
    <motion.div
      className={fullHeight ? 'h-full' : ''}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}