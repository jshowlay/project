import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

interface DeltaBadgeProps {
  delta: number;
  className?: string;
}

export default function DeltaBadge({ delta, className }: DeltaBadgeProps) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  const isNeutral = delta === 0;

  const getIcon = () => {
    if (isPositive) return <TrendingUp className="w-3 h-3" />;
    if (isNegative) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getColorClasses = () => {
    if (isPositive) return 'bg-green-100 text-green-800 border-green-200';
    if (isNegative) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
        getColorClasses(),
        className
      )}
    >
      {getIcon()}
      <span className="font-semibold">
        {isPositive ? '+' : ''}{delta}
      </span>
    </motion.div>
  );
}
