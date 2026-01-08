/**
 * StatusBadge Component
 * Reusable component for displaying portfolio approval status
 */

import { CheckCircle, Clock, XCircle } from 'lucide-react';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StatusBadgeProps {
    status: ApprovalStatus;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    showText?: boolean;
    className?: string;
}

/**
 * Status Badge Component
 * 
 * @param status - The approval status (PENDING, APPROVED, REJECTED)
 * @param size - Size variant (sm, md, lg)
 * @param showIcon - Whether to show the icon (default: true)
 * @param showText - Whether to show the text (default: true)
 * @param className - Additional CSS classes
 */
export function StatusBadge({
    status,
    size = 'md',
    showIcon = true,
    showText = true,
    className = '',
}: StatusBadgeProps) {
    // Size configurations
    const sizeConfig = {
        sm: {
            icon: 10,
            text: 'text-[9px] sm:text-[10px]',
            px: 'px-1.5 md:px-2',
            py: 'py-0.5',
            gap: 'gap-0.5',
        },
        md: {
            icon: 12,
            text: 'text-[10px] md:text-xs',
            px: 'px-2 md:px-3',
            py: 'py-0.5 md:py-1',
            gap: 'gap-1',
        },
        lg: {
            icon: 14,
            text: 'text-xs md:text-sm',
            px: 'px-3 md:px-4',
            py: 'py-1 md:py-1.5',
            gap: 'gap-1.5',
        },
    };

    const config = sizeConfig[size];

    // Status configurations
    const statusConfig = {
        APPROVED: {
            bg: 'bg-green-100',
            text: 'text-green-700',
            icon: <CheckCircle size={config.icon} />,
            label: 'Tasdiqlangan',
            shortLabel: '✓',
        },
        REJECTED: {
            bg: 'bg-red-100',
            text: 'text-red-700',
            icon: <XCircle size={config.icon} />,
            label: 'Rad etilgan',
            shortLabel: '✗',
        },
        PENDING: {
            bg: 'bg-orange-100',
            text: 'text-orange-700',
            icon: <Clock size={config.icon} />,
            label: 'Kutilmoqda',
            shortLabel: '⏳',
        },
    };

    const statusInfo = statusConfig[status];

    return (
        <span
            className={`
        inline-flex items-center
        ${config.gap}
        ${config.px}
        ${config.py}
        ${statusInfo.bg}
        ${statusInfo.text}
        ${config.text}
        font-medium
        rounded-full
        whitespace-nowrap
        ${className}
      `}
            title={statusInfo.label}
            aria-label={`Status: ${statusInfo.label}`}
        >
            {showIcon && statusInfo.icon}
            {showText && (
                <>
                    <span className="hidden sm:inline">{statusInfo.label}</span>
                    <span className="sm:hidden">{statusInfo.shortLabel}</span>
                </>
            )}
        </span>
    );
}

/**
 * Get status color for use in other components
 */
export function getStatusColor(status: ApprovalStatus): string {
    switch (status) {
        case 'APPROVED':
            return 'green';
        case 'REJECTED':
            return 'red';
        case 'PENDING':
            return 'orange';
        default:
            return 'gray';
    }
}

/**
 * Get status label
 */
export function getStatusLabel(status: ApprovalStatus): string {
    switch (status) {
        case 'APPROVED':
            return 'Tasdiqlangan';
        case 'REJECTED':
            return 'Rad etilgan';
        case 'PENDING':
            return 'Kutilmoqda';
        default:
            return 'Noma\'lum';
    }
}
