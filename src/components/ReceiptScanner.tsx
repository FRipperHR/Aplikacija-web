import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, Trash2, Plus, Sparkles, FileText, X } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  categoryName?: string;
  categoryId?: string;
}

interface ExtractionResult {
  date: string;
  items: ExtractedItem[];
}

export const ReceiptScanner = () => {
  const { state, addMaterial, updateMaterial } = useApp();
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    if (result) {
      setSelectedIndices(new Set(result.items.map((_, i) => i)));
    }
  }, [result]);

  const toggleItemSelection = (idx: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedIndices(newSelected);
  };
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      const fileArray = Array.from(files);
      
      let processed = 0;
      fileArray.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          processed++;
          if (processed === fileArray.length) {
            setImages(prev => [...prev, ...newImages]);
            setResult(null);
            setError(null);
            e.target.value = ''; // Resets input to allow uploading same file again
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const processReceipts = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      const apiKey = state.settings?.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "undefined") {
        throw new Error("Nije postavljen Gemini API Ključ. Molimo idite u 'Admin Zonu' i postavite svoj API ključ za AI skeniranje.");
      }

      const ai = new GoogleGenAI({ apiKey });
      let allItems: ExtractedItem[] = [];
      let latestDate = "";

      for (let i = 0; i < images.length; i++) {
        setProcessingProgress(Math.round(((i) / images.length) * 100));
        
        try {
          const dataUrl = images[i];
          const mimeTypeMatch = dataUrl.match(/^data:([^;]+);base64,/);
          const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
          const base64Data = dataUrl.split(',')[1];

          const prompt = `Analyze this receipt image. Extract all items purchased. 
          For each item, identify:
          - name: clear description
          - quantity: number
          - unit: (kom, kg, m2, m, etc)
          - pricePerUnit: price for one unit
          - categoryName: suggest one of existing categories (${state.categories.map(c => c.name).join(', ')}) or "Other"

          Also extract the transaction 'date' in YYYY-MM-DD format.
          Return the data strictly in JSON format matching this schema:
          {
            "date": "string",
            "items": [
              { "name": "string", "quantity": number, "unit": "string", "pricePerUnit": number, "categoryName": "string" }
            ]
          }`;

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: prompt }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        quantity: { type: Type.NUMBER },
                        unit: { type: Type.STRING },
                        pricePerUnit: { type: Type.NUMBER },
                        categoryName: { type: Type.STRING }
                      },
                      required: ["name", "quantity", "pricePerUnit", "unit"]
                    }
                  }
                },
                required: ["date", "items"]
              }
            }
          });

          let responseText = response.text || "";
          responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
          const extracted = JSON.parse(responseText) as ExtractionResult;
          
          // Use most recent date found or first date if not set
          if (!latestDate || extracted.date > latestDate) {
            latestDate = extracted.date;
          }

          // Map categories to IDs and add to collection
          const itemsWithIds = extracted.items.map(item => {
            const category = state.categories.find(c => c.name.toLowerCase() === item.categoryName?.toLowerCase()) || state.categories[0];
            return { ...item, categoryId: category.id };
          });

          allItems = [...allItems, ...itemsWithIds];
        } catch (imageErr: any) {
          console.error(`Error processing image ${i}:`, imageErr);
          const errMsg = imageErr.message || "";
          if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key not valid")) {
            throw new Error(`Neispravan Gemini API Ključ. Molimo uspostavite ispravan ključ u 'Admin Zoni'.`);
          }
          throw new Error(`Slika ${i + 1} greška: ${errMsg || "Nepoznata greška prilikom obrade"}`);
        }
      }

      setProcessingProgress(100);
      setResult({ date: latestDate, items: allItems });
    } catch (err: any) {
      console.error(err);
      setError(`Neuspjelo očitavanje: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateItem = (idx: number, updates: Partial<ExtractedItem>) => {
    if (!result) return;
    const newItems = [...result.items];
    newItems[idx] = { ...newItems[idx], ...updates };
    setResult({ ...result, items: newItems });
  };

  const handleDeleteItem = (idx: number) => {
    if (!result) return;
    const newItems = result.items.filter((_, i) => i !== idx);
    setResult({ ...result, items: newItems });
  };

  const handleSaveAll = async () => {
    if (!result || selectedIndices.size === 0) return;

    setIsSaving(true);
    let addedCount = 0;
    let mergedCount = 0;

    // Small delay to make it feel like it's saving to DB
    await new Promise(resolve => setTimeout(resolve, 800));

    result.items.forEach((item, idx) => {
      if (!selectedIndices.has(idx)) return;

      const categoryId = item.categoryId || state.categories[0].id;
      const date = result.date || new Date().toISOString().split('T')[0];

      // Smart merging: check if item with same name, category and date already exists
      const existing = state.materials.find(m => 
        m.name.toLowerCase() === item.name.toLowerCase() && 
        m.categoryId === categoryId && 
        m.date === date &&
        m.unit === item.unit
      );

      if (existing) {
        updateMaterial(existing.id, {
          quantity: existing.quantity + item.quantity
        });
        mergedCount++;
      } else {
        addMaterial({
          name: item.name,
          categoryId: categoryId,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          unit: item.unit,
          date: date,
          savingAmount: 0,
          deliveryCost: 0,
          workCost: 0
        });
        addedCount++;
      }
    });

    setResult(null);
    setImages([]);
    setIsSaving(false);
    alert(`Uspješno spremljeno u bazu podataka!\nDodano novih: ${addedCount}\nSpojeno s postojećima: ${mergedCount}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-500" />
            AI Skeniranje Računa
          </div>
          {images.length > 0 && !result && (
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500">
              {images.length} učitanih slika
            </span>
          )}
        </h3>

        <input 
          type="file" 
          ref={cameraInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={galleryInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          multiple
          className="hidden" 
        />

        {images.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => cameraInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
            >
              <div className="w-14 h-14 bg-sky-50 dark:bg-sky-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7 text-sky-500" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white">Fotografiraj</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">Kamera uživo</p>
            </div>

            <div 
              onClick={() => galleryInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
            >
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7 text-indigo-500" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white">Učitaj slike</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">Skupni odabir iz galerije</p>
            </div>
          </div>
        ) : !result ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black group">
                  <img src={img} alt={`Receipt ${idx + 1}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-slate-400 group"
              >
                <Camera className="w-6 h-6 group-hover:text-sky-500 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-center">Dodaj još<br/>(Kamera)</span>
              </button>
              <button 
                onClick={() => galleryInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-slate-400 group"
              >
                <Upload className="w-6 h-6 group-hover:text-indigo-500 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-center">Dodaj još<br/>(Galerija)</span>
              </button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={processReceipts}
                disabled={isProcessing}
                className={cn(
                  "px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl min-w-[240px] justify-center",
                  isProcessing 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-1 active:translate-y-0"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Obrađujem ({processingProgress}%)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-sky-400" />
                    Analiziraj sve ({images.length})
                  </>
                )}
              </button>
              
              {!isProcessing && (
                <button 
                  onClick={() => setImages([])}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                  Očisti listu
                </button>
              )}
            </div>
          </div>
        ) : null}

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Pronađeni podaci</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Datum kupnje:</span>
                    <input 
                      type="date"
                      value={result.date}
                      onChange={(e) => setResult({ ...result, date: e.target.value })}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-sm font-bold outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest shrink-0">Uspješno pročitano</span>
                </div>
              </div>

              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr>
                      <th className="py-2 w-8 text-center border-b border-slate-100 dark:border-slate-800">
                        <button 
                          onClick={() => {
                            if (selectedIndices.size === result.items.length) setSelectedIndices(new Set());
                            else setSelectedIndices(new Set(result.items.map((_, i) => i)));
                          }}
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                            selectedIndices.size === result.items.length
                              ? "bg-sky-500 border-sky-500 text-white"
                              : "border-slate-300 dark:border-slate-700"
                          )}
                        >
                          {selectedIndices.size === result.items.length && <CheckCircle2 className="w-3 h-3" />}
                        </button>
                      </th>
                      <th className="py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Materijal</th>
                      <th className="py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-center">Kol.</th>
                      <th className="py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-center">Poj. cijena</th>
                      <th className="py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Ukupno</th>
                      <th className="py-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Akcije</th>
                    </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {result.items.map((item, idx) => (
                      <tr key={idx} className={cn("group transition-colors", !selectedIndices.has(idx) && "opacity-50 grayscale-[0.5]")}>
                        <td className="py-3 text-center">
                          <button 
                            onClick={() => toggleItemSelection(idx)}
                            className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                              selectedIndices.has(idx)
                                ? "bg-sky-500 border-sky-500 text-white"
                                : "border-slate-300 dark:border-slate-700"
                            )}
                          >
                            {selectedIndices.has(idx) && <CheckCircle2 className="w-3 h-3" />}
                          </button>
                        </td>
                        <td className="py-3 pr-2">
                          <div className="space-y-1">
                            <input 
                              type="text" 
                              value={item.name}
                              onChange={(e) => handleUpdateItem(idx, { name: e.target.value })}
                              className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-sky-500 hover:bg-slate-50 focus:bg-white dark:hover:bg-slate-800 dark:focus:bg-slate-900 px-2 py-1 rounded text-xs font-bold transition-colors outline-none"
                            />
                            <select 
                              value={item.categoryId}
                              onChange={(e) => handleUpdateItem(idx, { categoryId: e.target.value })}
                              className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-sky-500 hover:bg-slate-50 focus:bg-white dark:hover:bg-slate-800 dark:focus:bg-slate-900 px-1 py-1 rounded text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-tighter transition-colors outline-none cursor-pointer"
                            >
                              {state.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                        </td>
                        <td className="py-3 text-center align-top">
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <input 
                              type="number" 
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => handleUpdateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                              className="w-14 bg-transparent border border-transparent hover:border-slate-200 focus:border-sky-500 hover:bg-slate-50 focus:bg-white dark:hover:bg-slate-800 dark:focus:bg-slate-900 px-1 py-1 rounded text-xs font-bold text-center text-slate-700 dark:text-slate-300 transition-colors outline-none"
                            />
                            <input 
                              type="text" 
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(idx, { unit: e.target.value })}
                              className="w-10 bg-transparent border border-transparent hover:border-slate-200 focus:border-sky-500 hover:bg-slate-50 focus:bg-white dark:hover:bg-slate-800 dark:focus:bg-slate-900 px-1 py-1 rounded text-xs font-bold text-center text-slate-500 transition-colors outline-none"
                            />
                          </div>
                        </td>
                        <td className="py-3 text-center align-top">
                           <div className="flex justify-center mt-1">
                            <input 
                              type="number" 
                              value={item.pricePerUnit === 0 ? '' : item.pricePerUnit}
                              onChange={(e) => handleUpdateItem(idx, { pricePerUnit: parseFloat(e.target.value) || 0 })}
                              className="w-20 bg-transparent border border-transparent hover:border-slate-200 focus:border-sky-500 hover:bg-slate-50 focus:bg-white dark:hover:bg-slate-800 dark:focus:bg-slate-900 px-1 py-1 rounded text-xs font-bold text-center text-slate-700 dark:text-slate-300 transition-colors outline-none"
                            />
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <span className="font-black text-slate-900 dark:text-white text-xs">{(item.quantity * item.pricePerUnit).toFixed(2)} €</span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => handleDeleteItem(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                              title="Ukloni"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="py-4 text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ukupan iznos računa</span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          {result.items.reduce((acc, curr) => acc + (curr.quantity * curr.pricePerUnit), 0).toFixed(2)} €
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setResult(null)}
                  disabled={isSaving}
                  className="px-6 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Odbaci sve
                </button>
                <button 
                  onClick={handleSaveAll}
                  disabled={isSaving || selectedIndices.size === 0}
                  className={cn(
                    "px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                    isSaving && "animate-pulse"
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Spremanje u bazu...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Spremi u materijale ({selectedIndices.size})
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
