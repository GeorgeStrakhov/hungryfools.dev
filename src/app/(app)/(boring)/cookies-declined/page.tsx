import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cookie, ArrowLeft, ExternalLink } from "lucide-react";

export default function CookiesDeclinedPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 py-16">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <Cookie className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Cookies Required</CardTitle>
          <CardDescription className="text-center">
            We&apos;re sorry, but our website currently requires cookies to
            function properly.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground text-sm">
            We use cookies to provide essential features like user
            authentication, session management, and to improve your experience
            on our platform.
          </p>

          <p className="text-muted-foreground text-sm">
            Without cookies, we cannot ensure the security and functionality
            that our users expect.
          </p>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              We respect your privacy and only use necessary cookies. You can
              learn more about our cookie usage in our privacy policy.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Homepage
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/privacy">
              Learn About Our Privacy Policy
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
