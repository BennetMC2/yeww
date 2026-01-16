'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'selectable' | 'selected';
  padding?: 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl transition-all duration-300 ease-out';

    const variants = {
      default: 'bg-white',
      selectable: 'bg-[#F5EDE4] cursor-pointer hover:bg-[#EBE3DA]',
      selected: 'bg-[#FFE8DC] border-2 border-[#E07A5F]',
    };

    const paddings = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
