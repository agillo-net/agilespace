import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";

function App() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4">Hello, {user.email}</h1>
      <Button onClick={logout} variant="secondary">
        Logout
      </Button>
    </div>
  );
}

export default App;
