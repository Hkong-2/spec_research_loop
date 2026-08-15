"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DecisionResponse } from "@/lib/api/generated/model";
import { WorkflowNode } from "@/lib/api/generated/model";

import { WORKFLOW_NODE_LABELS } from "./catalog";

function workflowNodeLabel(node: DecisionResponse["node"]): string {
  if (node && Object.values(WorkflowNode).includes(node)) {
    return WORKFLOW_NODE_LABELS[node];
  }
  return node ?? "None";
}

function formatTimestamp(value: string): string {
  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

export function DecisionHistory({ decisions }: { decisions: DecisionResponse[] }) {
  return (
    <section aria-label="Decision history">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-navy">Decision history</CardTitle>
          <CardDescription>
            Decision history does not include snapshot content, version diff, or revert.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {decisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Decisions</p>
          ) : (
            <ol className="grid gap-3">
              {decisions.map((decision) => (
                <li key={decision.id} className="rounded-md border bg-muted/40 px-3 py-2">
                  <dl className="grid gap-1 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Decision kind</dt>
                      <dd>{decision.kind}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Workflow Node</dt>
                      <dd>{workflowNodeLabel(decision.node)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Timestamp</dt>
                      <dd>{formatTimestamp(decision.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Stage Revision id</dt>
                      <dd className="break-all">{decision.stage_revision_id ?? "None"}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
