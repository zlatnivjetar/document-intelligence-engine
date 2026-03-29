'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  createAnthropicProvider,
  extract,
  type ExtractOptions,
  type ExtractionInput,
} from '@/lib/docpipe';
import { ApiKeyField } from '@/components/docpipe/api-key-field';
import { ResultsPreview } from '@/components/docpipe/results-preview';
import { TemplateSelector } from '@/components/docpipe/template-selector';
import { UploadDropzone } from '@/components/docpipe/upload-dropzone';
import {
  useSessionStorageState,
} from '@/hooks/use-session-storage';
import { readFileAsBase64, isSupportedDocument } from '@/lib/file-input';
import {
  BUILT_IN_TEMPLATES,
  type BuiltInTemplateDefinition,
  type BuiltInTemplateId,
} from '@/lib/templates';

const UNSUPPORTED_FILE_ERROR =
  'That file is not supported. Use PDF, PNG, or JPG and try again.';

type SelectedTemplateId = BuiltInTemplateId | '';

function getTemplateById(
  templateId: SelectedTemplateId,
): BuiltInTemplateDefinition | undefined {
  if (templateId === '') {
    return undefined;
  }

  return BUILT_IN_TEMPLATES.find((template) => template.id === templateId);
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  return 'Extraction failed. Check your document and key, then try again.';
}

export function DocpipeWorkspace(): React.JSX.Element {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<SelectedTemplateId>('');
  const [apiKey, setApiKey] = useSessionStorageState('docpipe.anthropicApiKey', '');
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultJson, setResultJson] = useState<string | null>(null);
  const [overallConfidence, setOverallConfidence] = useState<number | null>(null);

  function handleFileSelect(file: File | null): void {
    if (file === null) {
      return;
    }

    if (!isSupportedDocument(file)) {
      setErrorMessage(UNSUPPORTED_FILE_ERROR);
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  }

  async function handleExtract(): Promise<void> {
    if (selectedFile === null) {
      setErrorMessage('Select a PDF, PNG, or JPG document before extracting.');
      return;
    }

    if (apiKey.trim() === '') {
      setErrorMessage('Enter your Anthropic API key before extracting.');
      return;
    }

    if (selectedTemplateId === '') {
      setErrorMessage('Choose a template before extracting.');
      return;
    }

    const selectedTemplate = getTemplateById(selectedTemplateId);

    if (!selectedTemplate) {
      setErrorMessage('Choose a template before extracting.');
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);
    setResultJson(null);
    setOverallConfidence(null);

    try {
      const base64Document = await readFileAsBase64(selectedFile);
      const model = createAnthropicProvider({ apiKey: apiKey.trim() });
      const result = await extract<Record<string, unknown>>({
        input: {
          document: base64Document,
          mimeType: selectedFile.type as ExtractionInput['mimeType'],
        },
        schema:
          selectedTemplate.schema as ExtractOptions<Record<string, unknown>>['schema'],
        model,
        schemaName: selectedTemplate.schemaName,
        schemaDescription: selectedTemplate.schemaDescription,
      });

      setResultJson(JSON.stringify(result.data, null, 2));
      setOverallConfidence(result.overallConfidence);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(20rem,0.88fr)] lg:items-start">
      <section className="space-y-6">
        <Card className="overflow-hidden bg-[linear-gradient(180deg,rgba(251,248,242,0.96),rgba(242,232,220,0.98))]">
          <CardHeader className="pb-0">
            <CardTitle className="text-[2rem] sm:text-[2.3rem]">
              Drop a document to start
            </CardTitle>
            <CardDescription>
              Add a PDF, PNG, or JPG, paste your Anthropic key for this session,
              then choose a template.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <UploadDropzone
              disabled={isExtracting}
              errorMessage={errorMessage}
              fileName={selectedFile?.name ?? null}
              onFileSelect={handleFileSelect}
            />
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
            <CardContent>
              <ApiKeyField
                disabled={isExtracting}
                onChange={(nextValue) => {
                  setApiKey(nextValue);
                  setErrorMessage(null);
                }}
                value={apiKey}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[1.75rem]">Template</CardTitle>
              <CardDescription>
                Start with the built-in templates from the Phase 4 contract.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateSelector
                disabled={isExtracting}
                onValueChange={(nextValue) => {
                  setSelectedTemplateId(nextValue);
                  setErrorMessage(null);
                }}
                value={selectedTemplateId}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-start">
          <Button
            className="w-full sm:w-auto"
            disabled={isExtracting}
            onClick={() => {
              void handleExtract();
            }}
            size="lg"
            type="button"
          >
            {isExtracting ? 'Extracting with your key...' : 'Extract document'}
          </Button>
        </div>
      </section>

      <aside>
        <ResultsPreview
          overallConfidence={overallConfidence}
          resultJson={resultJson}
        />
      </aside>
    </div>
  );
}
