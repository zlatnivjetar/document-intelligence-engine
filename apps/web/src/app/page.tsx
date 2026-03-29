import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const previewJson = `{
  "documentType": "invoice",
  "status": "awaiting_upload",
  "confidence": "pending",
  "fields": "Preview appears here after extraction"
}`;

export default function Home(): React.JSX.Element {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-10 h-64 w-64 rounded-full bg-[rgba(200,100,59,0.12)] blur-3xl" />
        <div className="absolute bottom-10 right-[-6rem] h-72 w-72 rounded-full bg-[rgba(217,204,184,0.75)] blur-3xl" />
      </div>

      <div className="relative mx-auto min-h-screen max-w-7xl px-6 py-12 sm:px-8 lg:px-16 lg:py-16">
        <div className="mb-12 max-w-2xl">
          <p className="mb-4 text-[0.8125rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Phase 4 shell
          </p>
          <h1 className="font-display text-[3rem] font-bold leading-none tracking-[-0.05em] text-[var(--color-ink)] sm:text-[4.5rem]">
            DocPipe
          </h1>
          <p className="mt-4 text-xl leading-[1.25] text-[var(--color-muted)] sm:text-2xl">
            Drop a document to start
          </p>
          <p className="mt-4 max-w-xl text-base text-[var(--color-muted)]">
            Add a PDF, PNG, or JPG, paste your Anthropic key for this session,
            then choose a template.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)] lg:items-start">
          <section className="space-y-6">
            <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(251,248,242,0.96),rgba(242,232,220,0.98))]">
              <CardHeader className="pb-0">
                <CardTitle className="text-[2rem] sm:text-[2.3rem]">
                  Upload surface
                </CardTitle>
                <CardDescription>
                  The upload area stays dominant above the fold and will host
                  drag-and-drop behavior in the next plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-[calc(var(--radius-lg)-6px)] border-2 border-dashed border-[rgba(200,100,59,0.28)] bg-[var(--color-surface)]/75 px-6 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:px-10 sm:py-20">
                  <div className="mx-auto max-w-sm space-y-3">
                    <p className="font-display text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.04em]">
                      PDF, PNG, or JPG
                    </p>
                    <p className="text-base text-[var(--color-muted)]">
                      Drag a document here or browse from your device once the
                      interactive flow lands.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[1.75rem]">Session key</CardTitle>
                  <CardDescription>
                    Browser-only storage keeps the key out of the server path.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="anthropic-api-key">Anthropic API key</Label>
                    <Input
                      id="anthropic-api-key"
                      placeholder="sk-ant-..."
                      type="password"
                    />
                  </div>
                  <p className="text-sm text-[var(--color-muted)]">
                    Stored for this session only.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[1.75rem]">Template</CardTitle>
                  <CardDescription>
                    Start with the built-in templates from the Phase 4 contract.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select defaultValue="invoice">
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="w2">W-2</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-start">
              <Button className="w-full sm:w-auto" size="lg">
                Extract document
              </Button>
            </div>
          </section>

          <aside>
            <Card className="sticky top-8 bg-[rgba(251,248,242,0.94)]">
              <CardHeader>
                <CardTitle className="text-[2rem]">Result preview</CardTitle>
                <CardDescription>
                  Structured output stays in-page with a plain JSON readout
                  before exports are introduced.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[rgba(217,204,184,0.36)] px-4 py-3 text-sm text-[var(--color-muted)]">
                  <span>Overall confidence</span>
                  <span className="font-semibold text-[var(--color-ink)]">
                    Pending upload
                  </span>
                </div>
                <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-ink)] px-5 py-5 font-mono text-sm leading-7 text-[rgba(251,248,242,0.92)]">
                  <code>{previewJson}</code>
                </pre>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
