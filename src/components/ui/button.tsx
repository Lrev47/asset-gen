import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground hover:bg-accent-hover shadow-glow hover:shadow-glow",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg",
        outline:
          "border border-border bg-surface/80 backdrop-blur-sm text-text-primary hover:border-accent/50 hover:bg-surface-raised/80 hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 backdrop-blur-sm",
        ghost: "bg-transparent text-text-secondary hover:bg-surface/60 hover:text-text-primary backdrop-blur-sm",
        link: "text-accent underline-offset-4 hover:underline bg-transparent p-0 h-auto font-normal",
        glass: "glass glass-hover text-text-primary",
        gradient: "bg-gradient-to-r from-accent to-accent-hover text-accent-foreground hover:from-accent-hover hover:to-accent shadow-glow",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-sm",
        default: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-lg",
        icon: "h-10 w-10",
      },
      glow: {
        none: "",
        subtle: "hover:shadow-md",
        default: "hover:shadow-glow",
        intense: "shadow-glow hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    glow,
    asChild = false, 
    loading = false,
    loadingText,
    icon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const isDisabled = disabled || loading;
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, glow, className }))}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {/* Shimmer effect for glass/gradient variants */}
        {(variant === "glass" || variant === "gradient") && (
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        )}
        
        {/* Content wrapper */}
        <span className="flex items-center gap-2">
          {loading ? (
            <>
              <svg 
                className="animate-spin h-4 w-4" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {loadingText || "Loading..."}
            </>
          ) : (
            <>
              {icon && <span className="flex-shrink-0">{icon}</span>}
              {children}
            </>
          )}
        </span>
      </Comp>
    );
  }
);
Button.displayName = "Button";

// Specialized button variants for common use cases
export const GlowButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ glow = "default", ...props }, ref) => (
    <Button glow={glow} ref={ref} {...props} />
  )
);
GlowButton.displayName = "GlowButton";

export const GlassButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "glass", ...props }, ref) => (
    <Button variant={variant} ref={ref} {...props} />
  )
);
GlassButton.displayName = "GlassButton";

export const GradientButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "gradient", glow = "default", ...props }, ref) => (
    <Button variant={variant} glow={glow} ref={ref} {...props} />
  )
);
GradientButton.displayName = "GradientButton";

export { Button, buttonVariants };