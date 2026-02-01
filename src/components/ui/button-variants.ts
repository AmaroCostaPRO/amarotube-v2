import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-neo-outset active:shadow-neo-inset active:translate-y-[1px] hover:scale-[1.01]",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-neo-outset active:shadow-neo-inset active:translate-y-[1px] hover:scale-[1.01]",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-neo-outset active:shadow-neo-inset active:translate-y-[1px] hover:scale-[1.01]",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-neo-outset active:shadow-neo-inset active:translate-y-[1px] hover:scale-[1.01]",
                ghost: "hover:bg-accent hover:text-accent-foreground active:translate-y-[1px] hover:scale-[1.01]",
                link: "text-primary underline-offset-4 hover:underline active:translate-y-[1px] hover:scale-[1.01]",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-xl px-3",
                lg: "h-11 rounded-xl px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);
