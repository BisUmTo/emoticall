'use client';

import type { AnalyzeEmotionOutput } from '@/ai/flows/analyze-emotion';
import { analyzeEmotion } from '@/ai/flows/analyze-emotion';
import { EmotionDisplay } from '@/components/emotion-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Camera, Loader2, VideoOff } from 'lucide-react';
import React, { useRef, useState, useCallback, useEffect } from 'react';

export default function EmotiCallPage() {
  const [webcamStatus, setWebcamStatus] = useState<'idle' | 'pending' | 'active' | 'error' | 'denied'>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeEmotionOutput | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startWebcam = useCallback(async () => {
    setWebcamStatus('pending');
    setErrorMessage(null);
    setAnalysisResult(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error("Error playing video:", err);
            setErrorMessage("Could not play video stream.");
            setWebcamStatus('error');
          });
        };
      }
      setWebcamStatus('active');
    } catch (err) {
      console.error("Error accessing webcam:", err);
      if (err instanceof Error) {
        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setErrorMessage("No webcam found. Please connect a camera.");
        } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setErrorMessage("Webcam access denied. Please allow camera permission in your browser settings.");
          setWebcamStatus('denied');
          return; 
        } else {
          setErrorMessage("Error accessing webcam. Please ensure it's not in use by another application.");
        }
      } else {
        setErrorMessage("An unknown error occurred while accessing the webcam.");
      }
      setWebcamStatus('error');
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamStatus('idle');
    setAnalysisResult(null);
  }, []);

  const captureSnapshotAndAnalyze = useCallback(async () => {
    if (!videoRef.current || webcamStatus !== 'active') {
      setErrorMessage("Webcam is not active or not ready.");
      return;
    }

    setIsLoadingAnalysis(true);
    setAnalysisResult(null);
    setErrorMessage(null);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setErrorMessage("Failed to get canvas context for snapshot.");
      setIsLoadingAnalysis(false);
      return;
    }
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    try {
      const result = await analyzeEmotion({ photoDataUri });
      setAnalysisResult(result);
    } catch (error) {
      console.error("Emotion analysis failed:", error);
      setErrorMessage("Failed to analyze emotion. Please try again.");
      setAnalysisResult(null);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [webcamStatus]);

  useEffect(() => {
    // Cleanup stream when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8 selection:bg-primary/30 selection:text-primary-foreground">
      <Card className="w-full max-w-2xl shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="bg-card">
          <CardTitle className="text-3xl sm:text-4xl font-bold text-center text-primary tracking-tight">
            EmotiCall
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${webcamStatus === 'active' ? 'block' : 'hidden'}`}
              playsInline
              muted
              aria-label="Webcam Feed"
            />
            {webcamStatus !== 'active' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                {webcamStatus === 'pending' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                {(webcamStatus === 'idle' || webcamStatus === 'denied' || webcamStatus === 'error') && <VideoOff className="h-16 w-16" />}
                {webcamStatus === 'idle' && <p className="mt-2">Webcam is off</p>}
                {webcamStatus === 'denied' && <p className="mt-2 text-center">Webcam access denied. <br/>Enable permissions to start.</p>}
                {webcamStatus === 'error' && !errorMessage && <p className="mt-2">Error starting webcam</p>}
              </div>
            )}
          </div>

          {errorMessage && (
            <div role="alert" className="p-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md text-center">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {webcamStatus !== 'active' ? (
              <Button 
                onClick={startWebcam} 
                disabled={webcamStatus === 'pending'}
                className="w-full sm:w-auto text-lg py-3 px-6 bg-accent hover:bg-accent/90 text-accent-foreground"
                aria-label="Activate Webcam"
              >
                {webcamStatus === 'pending' ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-5 w-5" />
                )}
                Activate Webcam
              </Button>
            ) : (
              <Button 
                onClick={stopWebcam} 
                variant="outline" 
                className="w-full sm:w-auto text-lg py-3 px-6"
                aria-label="Stop Webcam"
              >
                <VideoOff className="mr-2 h-5 w-5" />
                Stop Webcam
              </Button>
            )}
          </div>
          
          {webcamStatus === 'active' && (
            <div className="text-center mt-4">
              <Button
                onClick={captureSnapshotAndAnalyze}
                disabled={isLoadingAnalysis}
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold text-xl sm:text-2xl py-6 sm:py-8 px-8 sm:px-10 rounded-lg shadow-lg transition-all duration-150 ease-in-out hover:shadow-xl active:scale-95 w-full"
                aria-label="Call for Help - Capture and Analyze Emotion"
              >
                {isLoadingAnalysis ? (
                  <Loader2 className="mr-3 h-7 w-7 sm:h-8 sm:w-8 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-3 h-7 w-7 sm:h-8 sm:w-8" />
                )}
                Call for Help
              </Button>
            </div>
          )}
          
          <EmotionDisplay result={analysisResult} isLoading={isLoadingAnalysis} />

        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground py-3 bg-secondary/50">
          <p className="w-full">Your privacy is important. Images are processed for analysis and not stored long-term.</p>
        </CardFooter>
      </Card>
    </main>
  );
}
