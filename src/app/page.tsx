import { cookies } from "next/headers";
import { RelayFrameApp } from "@/components/relayframe-app";
import { listModelCapabilities } from "@/providers/registry";
import { workspaceService } from "@/services/workspace-service";
import {
  isDemoMode,
  SESSION_COOKIE,
  verifySessionToken,
} from "@/security/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (
    !isDemoMode() &&
    (!session || session.organizationId !== "org_demo")
  ) {
    return (
      <main className="security-gate">
        <span>RF</span>
        <p>Secure workspace</p>
        <h1>Authentication required</h1>
        <p>
          RelayFrame fails closed in production. Configure the OIDC session
          integration and SESSION_SECRET before granting workspace access.
        </p>
      </main>
    );
  }
  return (
    <RelayFrameApp
      initialSnapshot={workspaceService.snapshot()}
      models={listModelCapabilities()}
    />
  );
}
