import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from './Button';
import { Sparkles, Loader2, Wand2, X } from 'lucide-react';

interface AIImageEditorProps {
  imageUrl: string;
  onUpdateImage: (newImageUrl: string) => void;
  onClose: () => void;
}

export const AIImageEditor: React.FC<AIImageEditorProps> = ({ imageUrl, onUpdateImage, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleEdit = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Convert current image to base64
      const responseImg = await fetch(imageUrl);
      const blob = await responseImg.blob();
      const reader = new FileReader();
      
      const base64Data = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(blob);
      });

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Data,
              },
            },
            { text: `Edit this packaging image according to this instruction: ${prompt}. Output only the resulting image.` },
          ],
        },
      });

      let foundImage = false;
      if (result.candidates?.[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData) {
            const newImage = `data:image/png;base64,${part.inlineData.data}`;
            onUpdateImage(newImage);
            foundImage = true;
            onClose();
            break;
          }
        }
      }

      if (!foundImage) {
        setError('AI 未返回有效图片，请尝试更换描述。');
      }
    } catch (err) {
      console.error(err);
      setError('AI 编辑失败，请稍后重试。');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="p-4 border-b flex justify-between items-center bg-emerald-50">
          <div className="flex items-center text-emerald-700 font-bold">
            <Sparkles className="w-5 h-5 mr-2" />
            AI 设计助手
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-full">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="aspect-video w-full bg-gray-100 rounded-xl overflow-hidden border">
            <img src={imageUrl} alt="Original" className="w-full h-full object-contain" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">修改指令 (中文或英文)</label>
            <div className="relative">
              <textarea
                className="w-full border-2 border-gray-100 rounded-xl p-4 pr-12 focus:border-emerald-500 focus:ring-0 text-sm min-h-[100px] bg-gray-50"
                placeholder="例如：'添加复古滤镜'、'将背景换成中药材背景'、'调高饱和度'..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="absolute right-3 bottom-3">
                 <Wand2 className="w-5 h-5 text-emerald-300" />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button 
              className="flex-1 py-4 text-base rounded-xl shadow-lg shadow-emerald-200"
              onClick={handleEdit}
              disabled={isProcessing || !prompt.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI 正在绘画中...
                </>
              ) : (
                <>确认 AI 修改</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};