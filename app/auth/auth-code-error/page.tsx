import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function AuthError({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { error } = await searchParams
    const errorMessage = error ? decodeURIComponent(error as string) : "There was a problem signing you in. This could be due to an expired link or a cancelled login attempt."

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-destructive">Authentication Error</CardTitle>
                    <CardDescription>
                        {errorMessage}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Button asChild>
                        <Link href="/">Try Again</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
