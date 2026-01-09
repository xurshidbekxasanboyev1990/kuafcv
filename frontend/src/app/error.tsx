'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Unhandled application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
            <Card className="w-full max-w-md shadow-xl border-none bg-white">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center animate-pulse">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Xatolik yuz berdi!
                    </CardTitle>
                    <p className="text-base font-medium text-gray-700">
                        Kutilmagan xatolik aniqlandi.
                    </p>
                </CardHeader>
                <CardContent className="text-center space-y-2 pb-6">
                    <p className="text-sm text-muted-foreground">
                        Bizning texnik jamoamiz xabardor qilindi. Iltimos, sahifani yangilang yoki birozdan so'ng qayta urinib ko'ring.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-4 bg-gray-100 rounded-md text-left overflow-auto max-h-40 text-xs font-mono text-red-600">
                            {error.message}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pb-8">
                    <Button onClick={reset} size="lg" className="w-full gap-2 transition-transform active:scale-95">
                        <RotateCcw className="h-4 w-4" />
                        Qayta urinib ko'rish
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full gap-2">
                        <Link href="/">
                            <Home className="h-4 w-4" />
                            Bosh sahifaga qaytish
                        </Link>
                    </Button>
                </CardFooter>
            </Card>

            {/* Background decoration */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-50 rounded-full blur-3xl opacity-50 mix-blend-multiply" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-orange-50 rounded-full blur-3xl opacity-50 mix-blend-multiply" />
            </div>
        </div>
    );
}
