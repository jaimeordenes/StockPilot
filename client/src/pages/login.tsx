import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: any) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", { username, password });
      // on success, reload to pick up authenticated state
      window.location.href = "/";
    } catch (err: any) {
      setError(err?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <form onSubmit={submit} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white">Iniciar sesión</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuario</label>
            <Input value={username} onChange={(e: any) => setUsername(e.target.value)} placeholder="jordenes" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
            <Input type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
