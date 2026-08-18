"use client";

import { useGetStage5DraftApiSpecStage5DraftGet, useConfirmStage5ApiSpecStage5ConfirmPost } from "@/lib/api/generated/endpoints";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";

export default function Stage5Page() {
  const { data: response, isLoading } = useGetStage5DraftApiSpecStage5DraftGet();
  const { mutate: confirmDraft, isPending } = useConfirmStage5ApiSpecStage5ConfirmPost();

  const [contribution, setContribution] = useState("");
  const [cards, setCards] = useState<any[]>([]);
  const [mockContext, setMockContext] = useState<any>(null);

  useEffect(() => {
    if (response?.data && 'draft' in response.data) {
      setContribution(response.data.draft.contribution || "");
      setCards(response.data.draft.cards || []);
      setMockContext(response.data.mock_context);
    }
  }, [response]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Generating Stage 5 Draft...</p>
      </div>
    );
  }

  const handleCardChange = (index: number, field: string, value: string) => {
    const newCards = [...cards];
    newCards[index][field] = value;
    setCards(newCards);
  };

  const removeCard = (index: number) => {
    const newCards = [...cards];
    newCards.splice(index, 1);
    setCards(newCards);
  };

  const addCard = () => {
    setCards([
      ...cards,
      {
        id: crypto.randomUUID(),
        claim: "",
        baseline: "",
        metric: "",
        evidence: "",
        rejection_condition: "",
      },
    ]);
  };

  const handleConfirm = () => {
    confirmDraft(
      { data: { contribution, cards } },
      {
        onSuccess: (res) => {
          if ('message' in res.data) {
             alert("Confirmed: " + res.data.message);
          }
        },
        onError: (err) => {
          alert("Error: " + err.message);
        },
      }
    );
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Stage 5: Contribution & Claims</h1>
        <p className="text-muted-foreground">
          Review and edit the generated contribution and claim-evidence cards based on your research idea.
        </p>
      </div>

      {mockContext && (
        <Card className="bg-zinc-50 border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Research Context</CardTitle>
            <CardDescription>Generated from previous stages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Problem:</strong> {mockContext.problem_statement}</p>
            <p><strong>RQ:</strong> {mockContext.research_question}</p>
            <p><strong>Gap:</strong> {mockContext.confirmed_gap}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">1. Main Contribution</h2>
        <Textarea
          value={contribution}
          onChange={(e) => setContribution(e.target.value)}
          className="min-h-[100px]"
          placeholder="Describe the main contribution of this research..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">2. Claim-Evidence Cards</h2>
          <Button variant="outline" size="sm" onClick={addCard}>
            <Plus className="w-4 h-4 mr-2" /> Add Card
          </Button>
        </div>

        {cards.map((card, index) => (
          <Card key={card.id || index} className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              onClick={() => removeCard(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Claim</Label>
                <Textarea
                  value={card.claim}
                  onChange={(e) => handleCardChange(index, "claim", e.target.value)}
                  placeholder="What is the claim?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Baseline</Label>
                  <Input
                    value={card.baseline}
                    onChange={(e) => handleCardChange(index, "baseline", e.target.value)}
                    placeholder="E.g. Human prompt"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Metric</Label>
                  <Input
                    value={card.metric}
                    onChange={(e) => handleCardChange(index, "metric", e.target.value)}
                    placeholder="E.g. Accuracy"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Evidence</Label>
                <Textarea
                  value={card.evidence}
                  onChange={(e) => handleCardChange(index, "evidence", e.target.value)}
                  placeholder="Where does the evidence come from?"
                />
              </div>
              <div className="space-y-2">
                <Label>Rejection Condition</Label>
                <Input
                  value={card.rejection_condition}
                  onChange={(e) => handleCardChange(index, "rejection_condition", e.target.value)}
                  placeholder="Under what condition is this claim rejected?"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleConfirm} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm & Continue to Stage 6
        </Button>
      </div>
    </div>
  );
}
