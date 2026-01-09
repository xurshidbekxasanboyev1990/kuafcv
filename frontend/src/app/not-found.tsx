'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
            <Card className="w-full max-w-md shadow-lg border-none bg-white">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileQuestion className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-gray-900">404</CardTitle>
                    <p className="text-lg font-medium text-gray-700">Sahifa topilmadi</p>
                </CardHeader>
                <CardContent className="text-center pb-6">
                    <p className="text-muted-foreground">
                        Kechirasiz, siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center pb-8">
                    <Button asChild size="lg" className="w-full">
                        <Link href="/" className="gap-2">
                            <Home className="h-4 w-4" />
                            Bosh sahifaga qaytish
                        </Link>
                    </Button>
                </CardFooter>
            </Card>

            {/* Background decoration */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-blob" />
                <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-blob animation-delay-2000" />
                <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-blob animation-delay-4000" />
            </div>
        </div>
    );
}
