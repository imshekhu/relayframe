import { RelayFrameApp } from "@/components/relayframe-app";
import { demoSnapshot } from "@/lib/demo-store";
import { listModelCapabilities } from "@/providers/registry";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <RelayFrameApp
      initialSnapshot={demoSnapshot()}
      models={listModelCapabilities()}
    />
  );
}
