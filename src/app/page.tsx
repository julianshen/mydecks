'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, FileText, Trash2, Edit, Presentation } from 'lucide-react';
import type { Deck } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/decks')
      .then(r => r.json())
      .then(setDecks);
  }, []);

  async function createDeck() {
    const res = await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle || 'Untitled Deck' }),
    });
    const deck = await res.json();
    setDecks([deck, ...decks]);
    setNewTitle('');
    setOpen(false);
    router.push(`/editor/${deck.id}`);
  }

  async function deleteDeck(id: string) {
    if (!confirm('Delete this deck?')) return;
    await fetch(`/api/decks/${id}`, { method: 'DELETE' });
    setDecks(decks.filter(d => d.id !== id));
  }

  return (
    <div className="min-h-screen bg-zinc-50" data-testid="home-page">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Presentation className="h-6 w-6 text-zinc-800" />
          <h1 className="text-xl font-bold text-zinc-900" data-testid="app-title">MyDecks</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)} data-testid="new-deck-btn">
            <Plus className="h-4 w-4 mr-1" /> New Deck
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deck</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Deck title..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createDeck()}
                data-testid="deck-title-input"
              />
              <Button onClick={createDeck} data-testid="create-deck-btn">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {decks.length === 0 ? (
          <div className="text-center py-20 text-zinc-400" data-testid="empty-state">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No decks yet. Create your first presentation!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="decks-grid">
            {decks.map(deck => (
              <Card key={deck.id} className="hover:shadow-md transition-shadow cursor-pointer group" data-testid={`deck-card-${deck.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base truncate">{deck.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-zinc-500 mb-3">
                    {new Date(deck.updated_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push(`/editor/${deck.id}`)} data-testid={`edit-deck-${deck.id}`}>
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push(`/present/${deck.id}`)} data-testid={`present-deck-${deck.id}`}>
                      <Presentation className="h-3 w-3 mr-1" /> Present
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteDeck(deck.id)} data-testid={`delete-deck-${deck.id}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
