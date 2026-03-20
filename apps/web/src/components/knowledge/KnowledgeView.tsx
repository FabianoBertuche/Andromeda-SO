import React, { useState } from 'react';
import { Book, FileText, Search, Settings, Vault } from 'lucide-react';
import { CollectionsList, Collection } from './CollectionsList';
import { DocumentManagement, Document } from './DocumentManagement';

type KnowledgeTab = 'collections' | 'documents' | 'retrieval' | 'vaults';

export function KnowledgeView() {
    const [activeTab, setActiveTab] = useState<KnowledgeTab>('collections');
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

    // Real state management
    const [collections, setCollections] = useState<Collection[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchCollections();
    }, []);

    useEffect(() => {
        if (selectedCollectionId && activeTab === 'documents') {
            fetchDocuments(selectedCollectionId);
        }
    }, [selectedCollectionId, activeTab]);

    const fetchCollections = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/knowledge/collections');
            const data = await response.json();
            setCollections(data);
        } catch (error) {
            console.error('Failed to fetch collections', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDocuments = async (cid: string) => {
        try {
            const response = await fetch(`/api/knowledge/collections/${cid}/documents`);
            const data = await response.json();
            setDocuments(data);
        } catch (error) {
            console.error('Failed to fetch documents', error);
        }
    };

    const handleUpload = async (files: FileList) => {
        if (!selectedCollectionId) return;

        // In a real implementation, we would use a loop or batch upload
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', file.name);

            try {
                await fetch(`/api/knowledge/collections/${selectedCollectionId}/documents`, {
                    method: 'POST',
                    body: formData
                });
            } catch (error) {
                console.error('Failed to upload', file.name, error);
            }
        }
        fetchDocuments(selectedCollectionId);
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await fetch(`/api/knowledge/documents/${docId}`, {
                method: 'DELETE'
            });
            if (selectedCollectionId) fetchDocuments(selectedCollectionId);
        } catch (error) {
            console.error('Failed to delete document', error);
        }
    };

    const handleCreateCollection = async () => {
        const name = prompt('Collection Name:');
        if (!name) return;
        try {
            await fetch('/api/knowledge/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: 'Created from Andromeda UI' })
            });
            fetchCollections();
        } catch (error) {
            console.error('Failed to create collection', error);
        }
    };

    const handleSelectCollection = (id: string) => {
        setSelectedCollectionId(id);
        setActiveTab('documents');
    };

    return (
        <div className="flex flex-col h-full bg-slate-950/40 backdrop-blur-sm">
            <header className="px-8 py-6 border-b border-white/5">
                <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
                    <Book className="w-6 h-6 text-indigo-400" />
                    Knowledge Layer
                </h2>
                <p className="text-slate-500 text-sm mt-1">Manage corpora, documents and agentic retrieval policies.</p>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sub-navigation */}
                <aside className="w-64 border-r border-white/5 py-6 px-4 bg-slate-900/20">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('collections')}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'collections' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5'
                                }`}
                        >
                            <Book className="w-4 h-4" />
                            Collections
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('documents');
                                // Don't reset selectedCollectionId, let it show empty state if null
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'documents' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Documents
                        </button>
                        <button
                            onClick={() => setActiveTab('retrieval')}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'retrieval' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5'
                                }`}
                        >
                            <Search className="w-4 h-4" />
                            Retrieval History
                        </button>
                        <button
                            onClick={() => setActiveTab('vaults')}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'vaults' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5'
                                }`}
                        >
                            <Vault className="w-4 h-4" />
                            Vault Management
                        </button>
                    </nav>
                </aside>

                {/* Content area */}
                <main className="flex-1 overflow-auto p-8">
                    {activeTab === 'collections' && (
                        <CollectionsList
                            collections={collections}
                            onSelect={handleSelectCollection}
                            onCreate={handleCreateCollection}
                        />
                    )}

                    {activeTab === 'documents' && selectedCollectionId ? (
                        <DocumentManagement
                            collectionId={selectedCollectionId}
                            documents={documents}
                            onUpload={handleUpload}
                            onDelete={handleDeleteDocument}
                        />
                    ) : activeTab === 'documents' ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a collection to manage documents.</p>
                        </div>
                    ) : null}

                    {activeTab === 'retrieval' && (
                        <div className="text-slate-500">Retrieval history tracking coming soon...</div>
                    )}

                    {activeTab === 'vaults' && (
                        <div className="text-slate-500">Obsidian Vault integration settings coming soon...</div>
                    )}
                </main>
            </div>
        </div>
    );
}
