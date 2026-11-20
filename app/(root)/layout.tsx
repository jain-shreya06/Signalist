import Header from "@/components/Header";
import { getAuth } from "@/lib/better-auth/auth";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";

const Layout = async ({ children }: { children : React.ReactNode }) => {
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = getAuthenticatedUserId(session);

    if (!userId || !session?.user) redirect('/sign-in');

    const user = {
        id: userId,
        name: session.user.name,
        email: session.user.email,
    }

    return (
        <main className="min-h-screen text-gray-400">
            <Header user={user} />

            <div className="container py-10">
                {children}
            </div>
        </main>
    )
}
export default Layout
