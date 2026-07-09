import { InstructionSessionPageContent } from "./InstructionSessionPageContent";

interface SessionWorkspacePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ student?: string }>;
}

export default function SessionWorkspacePage(props: SessionWorkspacePageProps) {
  return <InstructionSessionPageContent {...props} />;
}
