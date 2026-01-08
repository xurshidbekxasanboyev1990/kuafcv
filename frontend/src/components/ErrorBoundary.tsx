/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 * 
 * Usage:
 *   <ErrorBoundary fallback={<CustomErrorUI />}>
 *     <YourComponent />
 *   </ErrorBoundary>
 */

'use client';

import { reportError } from '@/lib/errorHandler';
import { AlertCircle } from 'lucide-react';
import React from 'react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console and error reporting service
        reportError(error, errorInfo);

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);

        // Update state with error info
        this.setState({
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                    <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl border border-red-100">
                        {/* Error Icon */}
                        <div className="mb-4 flex justify-center">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertCircle className="text-red-600" size={48} />
                            </div>
                        </div>

                        {/* Error Title */}
                        <h2 className="text-xl sm:text-2xl font-bold text-red-800 mb-2">
                            Xatolik yuz berdi
                        </h2>

                        {/* Error Description */}
                        <p className="text-red-600 mb-6 text-sm sm:text-base">
                            Nimadir noto'g'ri ketdi. Iltimos, sahifani yangilang yoki keyinroq qayta urinib ko'ring.
                        </p>

                        {/* Error Message (Development Only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                                <p className="font-mono text-xs text-red-800 break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-4 py-3 border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
                            >
                                Qayta urinish
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Sahifani yangilash
                            </button>
                        </div>

                        {/* Technical Details (Development Only) */}
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-600 font-medium hover:text-gray-800">
                                    📋 Texnik ma'lumot (faqat development)
                                </summary>
                                <pre className="mt-3 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64 text-gray-800 font-mono">
                                    {this.state.error?.stack}
                                    {'\n\n'}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Higher-order component to wrap any component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
