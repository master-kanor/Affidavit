import { useEffect, useState } from "react";
import { KeyRound, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

type Provider = "openrouter" | "nvidia" | "ollama" | "mistral" | "gemini";
type Connection = {
  id: string;
  provider: Provider;
  display_name: string;
  key_fingerprint: string;
  enabled: boolean;
  priority: number;
  free_only: boolean;
  paid_backup: boolean;
  status: string;
  last_tested_at: string | null;
  last_error: string | null;
};

const labels: Record<Provider, string> = {
  openrouter: "OpenRouter",
  nvidia: "NVIDIA NIM",
  ollama: "Ollama Cloud",
  mistral: "Mistral AI",
  gemini: "Google Gemini",
};

export function ProviderManager() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [provider, setProvider] = useState<Provider>("openrouter");
  const [name, setName] = useState("Primary");
  const [apiKey, setApiKey] = useState("");
  const [priority, setPriority] = useState(10);
  const [paidBackup, setPaidBackup] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const call = async (body?: object) => {
    const { data } = await supabase.auth.getSession();
    const response = await fetch("/api/ai/providers", {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = (await response.json()) as Record<string, unknown>;
    if (!response.ok)
      throw new Error(String(result.message ?? "Provider request failed"));
    return result;
  };
  const refresh = async () => {
    try {
      const result = await call();
      setConnections((result.connections ?? []) as Connection[]);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load providers"
      );
    }
  };
  useEffect(() => {
    void refresh();
  }, []);

  const save = async () => {
    setBusy("save");
    setMessage("");
    try {
      await call({
        action: "save",
        provider,
        displayName: name,
        apiKey,
        priority,
        freeOnly: !paidBackup,
        paidBackup,
      });
      setApiKey("");
      setMessage(
        "Credential encrypted. Select Sync models to test and discover models."
      );
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Connection could not be saved"
      );
    } finally {
      setBusy(null);
    }
  };
  const sync = async (id: string) => {
    setBusy(id);
    setMessage("");
    try {
      const result = await call({ action: "sync", id });
      setMessage(
        `${result.count} models discovered; ${result.freeCount} marked free or quota-tier.`
      );
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Model discovery failed"
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="border border-[#ccd5da] bg-[#fffdfa] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-[#cdbb86] bg-[#fff8e6]">
            <KeyRound className="h-5 w-5 text-[#8a6537]" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Add AI provider</h2>
            <p className="mt-1 text-sm text-[#68767e]">
              Keys are encrypted server-side and are never returned to the
              browser.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="text-xs font-semibold">
            Provider
            <select
              className="mt-2 h-11 w-full border border-[#cbd4d8] bg-white px-3 text-sm"
              value={provider}
              onChange={event => setProvider(event.target.value as Provider)}
            >
              {Object.entries(labels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Connection name
            <Input
              className="mt-2"
              value={name}
              onChange={event => setName(event.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            API key
            <Input
              className="mt-2"
              type="password"
              autoComplete="new-password"
              value={apiKey}
              onChange={event => setApiKey(event.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Priority
            <Input
              className="mt-2"
              type="number"
              min={1}
              max={999}
              value={priority}
              onChange={event => setPriority(Number(event.target.value))}
            />
          </label>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={paidBackup}
                onChange={event => setPaidBackup(event.target.checked)}
              />
              Allow as paid backup
            </label>
            <Button
              onClick={() => void save()}
              disabled={busy !== null || !apiKey || !name}
            >
              {busy === "save" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Encrypt & save"
              )}
            </Button>
          </div>
        </div>
        {message && (
          <p className="mt-4 border border-[#d8dfe2] bg-[#f5f6f6] p-3 text-sm text-[#526169]">
            {message}
          </p>
        )}
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {connections.map(connection => (
          <article
            key={connection.id}
            className="border border-[#ccd5da] bg-[#fffdfa] p-5"
          >
            <div className="flex items-center justify-between">
              <ShieldCheck className="h-5 w-5 text-[#4f7a5a]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#75838a]">
                {connection.status.replaceAll("_", " ")}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {labels[connection.provider]}
            </h3>
            <p className="text-sm text-[#68767e]">
              {connection.display_name} · key {connection.key_fingerprint}
            </p>
            <p className="mt-3 text-xs text-[#75838a]">
              Priority {connection.priority} ·{" "}
              {connection.paid_backup
                ? "Paid backup allowed"
                : "Free/quota tier only"}
            </p>
            {connection.last_error && (
              <p className="mt-3 text-xs text-red-700">
                {connection.last_error}
              </p>
            )}
            <Button
              variant="outline"
              className="mt-4 gap-2"
              onClick={() => void sync(connection.id)}
              disabled={busy !== null}
            >
              {busy === connection.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}{" "}
              Sync models
            </Button>
          </article>
        ))}
        {!connections.length && (
          <div className="border border-dashed border-[#b9c4c9] p-8 text-center text-sm text-[#75838a]">
            No provider connections saved.
          </div>
        )}
      </div>
    </div>
  );
}
