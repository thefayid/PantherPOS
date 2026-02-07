import React from 'react';
import { useUI } from '../context/UIContext';
import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => {
        const { isTouchMode } = useUI();
        const baseStyles = cn(
            'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white',
            isTouchMode && 'active:scale-[0.98]'
        );

        const variants = {
            primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus:ring-primary/50 font-bold',
            secondary: 'bg-secondary text-secondary-foreground border border-border shadow-sm hover:bg-secondary/80 focus:ring-ring/50',
            danger: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 focus:ring-destructive/50',
            ghost: 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-ring/50',
        };

        const sizes = {
            sm: isTouchMode ? 'h-10 px-4 text-xs' : 'h-8 px-3 text-[11px]',
            md: isTouchMode ? 'h-12 px-5 text-sm' : 'h-10 px-4 text-xs',
            lg: isTouchMode ? 'h-14 px-8 text-base' : 'h-12 px-6 text-sm',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && 'w-full',
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
