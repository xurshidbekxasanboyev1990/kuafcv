/**
 * StatusBadge Component
 * Reusable component for displaying portfolio approval status
 */

import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "text-foreground",
                success:
                    "border-transparent bg-green-100 text-green-700 hover:bg-green-200",
                warning:
                    "border-transparent bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
                info: "border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

// Backward compatibility or specific logic for Portfolio Status
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    status: ApprovalStatus;
    showIcon?: boolean;
}

export function StatusBadge({
    status,
    showIcon = true,
    className,
    ...props
}: StatusBadgeProps) {
    const config = {
        PENDING: {
            label: "Kutilmoqda",
            icon: Clock,
            variant: "warning" as const,
        },
        APPROVED: {
            label: "Tasdiqlandi",
            icon: CheckCircle,
            variant: "success" as const,
        },
        REJECTED: {
            label: "Rad etildi",
            icon: XCircle,
            variant: "destructive" as const,
        },
    };

    const { label, icon: Icon, variant } = config[status] || {
        label: status,
        icon: AlertCircle,
        variant: "secondary" as const,
    };

    return (
        <Badge variant={variant} className={cn("gap-1", className)} {...props}>
            {showIcon && <Icon className="h-3 w-3" />}
            {label}
        </Badge>
    );
}

export { Badge, badgeVariants };
export default StatusBadge;
