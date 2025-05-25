import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
    const { logout } = useAuth();

    return (
        <div className="flex flex-col gap-2 border-b">
            <div className="container mx-auto py-3 flex gap-2 justify-between items-center">
                <div className="flex gap-4">
                    <Link to="/" className="[&.active]:font-bold">
                        Home
                    </Link>
                    <Link to="/about" className="[&.active]:font-bold">
                        About
                    </Link>
                </div>
                <Button onClick={logout}>
                    Logout
                </Button>
            </div>
        </div>
    )
}
