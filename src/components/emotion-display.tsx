'use client';

import type { AnalyzeEmotionOutput } from '@/ai/flows/analyze-emotion';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smile, Frown, Meh, AlertCircle } from 'lucide-react';
import React from 'react';

interface EmotionDisplayProps {
  result: AnalyzeEmotionOutput | null;
  isLoading: boolean;
}

const getEmotionIcon = (emotion: string | undefined) => {
  const lowerEmotion = emotion?.toLowerCase() || '';
  if (lowerEmotion.includes('happy') || lowerEmotion.includes('joy')) return <Smile className="h-8 w-8 text-green-500" />;
  if (lowerEmotion.includes('sad') || lowerEmotion.includes('distress')) return <Frown className="h-8 w-8 text-blue-500" />;
  if (lowerEmotion.includes('angry') || lowerEmotion.includes('anger')) return <Frown className="h-8 w-8 text-red-500" />; // Could use a specific angry icon if available
  if (lowerEmotion.includes('neutral') || lowerEmotion.includes('calm')) return <Meh className="h-8 w-8 text-gray-500" />;
  if (lowerEmotion.includes('fear') || lowerEmotion.includes('scared')) return <AlertCircle className="h-8 w-8 text-purple-500" />;
  if (lowerEmotion.includes('surprise') || lowerEmotion.includes('surprised')) return <Smile className="h-8 w-8 text-yellow-500" />; // Using Smile for surprise as a placeholder
  return <Meh className="h-8 w-8 text-gray-500" />;
};


export function EmotionDisplay({ result, isLoading }: EmotionDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[100px] text-center" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-lg font-medium text-foreground">Analyzing emotion...</p>
        <p className="text-sm text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 min-h-[100px] text-center text-muted-foreground" aria-live="polite">
        Click "Call for Help" to analyze emotion.
      </div>
    );
  }

  return (
    <Card 
      className="mt-6 bg-secondary/50 border-border transition-all duration-500 ease-in-out transform animate-fadeIn"
      style={{ animationFillMode: 'forwards' }}
      aria-live="assertive"
      aria-atomic="true"
    >
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center mb-3">
          {getEmotionIcon(result.emotion)}
          <h3 className="text-2xl font-semibold ml-3 capitalize text-foreground">
            {result.emotion || 'Analysis Complete'}
          </h3>
        </div>
        
        {result.helpNeeded !== undefined && (
          <p className={`text-lg font-medium ${result.helpNeeded ? 'text-destructive' : 'text-green-600'}`}>
            {result.helpNeeded ? 'Assistance May Be Needed' : 'Appears to be Okay'}
          </p>
        )}
        {result.helpNeeded && (
           <p className="text-sm text-muted-foreground mt-1">
             Consider reaching out or offering support.
           </p>
        )}
      </CardContent>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation-name: fadeIn;
          animation-duration: 0.5s;
          animation-timing-function: ease-out;
        }
      `}</style>
    </Card>
  );
}
