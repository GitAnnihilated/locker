import { LoadingScreen } from "@/ui/components/LoadingScreen";

// The sidebar/header shell persists across in-app navigation — only the
// content area needs a loader, and no label: you'll see this often, so the
// spinner alone is enough once you've learned what it means.
export default function AppLoading() {
  return <LoadingScreen fullViewport={false} />;
}
