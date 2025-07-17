"use client";

import { useState, useRef, ChangeEvent, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Download, Palette, PenLine, Sparkles, Upload, X, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { suggestCartoonStyles } from '@/ai/flows/suggest-cartoon-styles';
import { generateCartoonImage } from '@/ai/flows/generate-cartoon-image';

const defaultStyles = ['Classic Comic', 'Anime', 'Pixar 3D', 'Chibi', 'Abstract Art', 'South Park'];
const palettes = [
  { name: 'Vibrant', colors: ['#FF69B4', '#FF4500', '#FFD700', '#4CAF50'] },
  { name: 'Pastel', colors: ['#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5'] },
  { name: 'Monochrome', colors: ['#2c2c2c', '#6a6a6a', '#ababab', '#e0e0e0'] },
  { name: 'Oceanic', colors: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'] },
];

export function ToonifyApp() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [suggestedStyles, setSuggestedStyles] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<string>('Vibrant');
  const [lineArtDetail, setLineArtDetail] = useState([50]);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const allStyles = useMemo(() => {
    const combined = [...suggestedStyles, ...defaultStyles];
    return [...new Set(combined)];
  }, [suggestedStyles]);

  useEffect(() => {
    if (step === 4 && uploadedImage && selectedStyle) {
      const generate = async () => {
        setIsGenerating(true);
        setGeneratedImage(null);
        try {
          const result = await generateCartoonImage({
            photoDataUri: uploadedImage,
            style: selectedStyle,
            palette: selectedPalette,
            lineArtDetail: lineArtDetail[0],
          });
          setGeneratedImage(result.generatedImageUri);
        } catch (error) {
          console.error('AI image generation failed:', error);
          toast({
            title: 'AI failed to create image',
            description: 'Something went wrong. Please try again or change settings.',
            variant: 'destructive',
          });
          setStep(3); // Go back to customization
        } finally {
          setIsGenerating(false);
        }
      };
      generate();
    }
  }, [step, uploadedImage, selectedStyle, selectedPalette, lineArtDetail, toast]);


  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 4MB.",
          variant: "destructive",
        });
        return;
      }

      setIsSuggesting(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedImage(dataUrl);
        setGeneratedImage(null); // Clear previous generation
        try {
          const result = await suggestCartoonStyles({ photoDataUri: dataUrl });
          setSuggestedStyles(result.suggestedStyles);
        } catch (error) {
          console.error('AI style suggestion failed:', error);
          toast({
            title: 'AI failed to suggest styles',
            description: 'Using default styles. You can still proceed.',
            variant: 'destructive',
          });
          setSuggestedStyles([]);
        } finally {
          setIsSuggesting(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setSuggestedStyles([]);
    setIsSuggesting(false);
    setIsGenerating(false);
    setStep(1);
    setSelectedStyle(null);
    setSelectedPalette('Vibrant');
    setLineArtDetail([50]);
    if (inputFileRef.current) {
      inputFileRef.current.value = "";
    }
  };

  const handleDownload = () => {
    const imageToDownload = generatedImage || uploadedImage;
    if (!imageToDownload) return;

    const link = document.createElement('a');
    link.href = imageToDownload;
    link.download = `RT AI Photo.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Image Downloaded!',
      description: 'Your cartoon masterpiece is on its way.',
    });
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -50, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const displayImage = generatedImage || uploadedImage;

  return (
    <Card className="w-full max-w-6xl shadow-2xl shadow-primary/10 border-primary/20 overflow-hidden">
      <AnimatePresence mode="wait">
        {!uploadedImage ? (
          <motion.div key="upload" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
            <CardContent className="p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, transition: { delay: 0.2, type: 'spring', stiffness: 200 } }}
                className="mb-6"
              >
                <Upload className="w-20 h-20 text-primary/50" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 font-headline">Upload Your Photo</h2>
              <p className="text-muted-foreground mb-6 max-w-sm">Drag & drop your image here, or click to browse. Max file size: 4MB.</p>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={inputFileRef} />
              <Button size="lg" onClick={() => inputFileRef.current?.click()}>
                <Sparkles className="mr-2 h-5 w-5" />
                Choose a Photo
              </Button>
            </CardContent>
          </motion.div>
        ) : (
          <motion.div key="editor" variants={cardVariants} initial="hidden" animate="visible" exit="exit" className="grid md:grid-cols-2 gap-0 min-h-[70vh]">
            <div className="p-6 bg-card-foreground/[.02] flex flex-col items-center justify-center relative">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10" onClick={handleReset}>
                <X className="h-5 w-5" /><span className="sr-only">Start Over</span>
              </Button>
              <motion.div 
                className="relative w-full aspect-square max-w-md rounded-lg overflow-hidden shadow-lg"
                initial={{scale: 0.9, opacity: 0}}
                animate={{scale: 1, opacity: 1, transition: {delay: 0.2}}}
              >
                {isGenerating && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                    <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground font-medium">Toonifying your image...</p>
                  </div>
                )}
                {displayImage && <Image src={displayImage} alt="User photo" layout="fill" objectFit="cover" data-ai-hint="portrait photo" />}
              </motion.div>
               <Button onClick={handleDownload} className="mt-6 bg-accent hover:bg-accent/90" size="lg" disabled={isGenerating || !displayImage}>
                <Download className="mr-2 h-5 w-5" />
                {isGenerating ? 'Please wait...' : 'Download'}
              </Button>
            </div>
            <div className="p-6 sm:p-8 flex flex-col">
              <h2 className="text-2xl font-bold mb-4 font-headline">Customize Your Toon</h2>
              <div className="space-y-8 flex-grow">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="step1" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
                      <h3 className="font-bold text-lg mb-4 flex items-center"><Sparkles className="mr-2 text-primary h-5 w-5" /> 1. Select an AI Style</h3>
                      {isSuggesting ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {allStyles.map(style => (
                            <Button key={style} variant={selectedStyle === style ? "default" : "secondary"} className="h-12 text-sm truncate" onClick={() => {
                              setSelectedStyle(style);
                              setStep(2);
                            }}>
                              {style}
                            </Button>
                          ))}
                        </div>
                      )}
                      {isSuggesting && <div className="flex items-center justify-center mt-4 text-muted-foreground"><LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>AI is analyzing your photo...</div>}
                    </motion.div>
                  )}
                  {step >= 2 && selectedStyle && (
                    <motion.div key="step2" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
                       <Button variant="link" onClick={() => setStep(1)} className="p-0 h-auto mb-2 text-muted-foreground">Change Style</Button>
                       <h3 className="font-bold text-lg mb-4 flex items-center"><Palette className="mr-2 text-primary h-5 w-5" /> 2. Choose Color Palette</h3>
                       <RadioGroup value={selectedPalette} onValueChange={(val) => {
                          setSelectedPalette(val);
                          setStep(3);
                        }} className="grid sm:grid-cols-2 gap-4">
                        {palettes.map(p => (
                          <Label key={p.name} htmlFor={p.name} className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:border-primary has-[input:checked]:border-primary has-[input:checked]:bg-primary/10">
                            <RadioGroupItem value={p.name} id={p.name} />
                            <span className="font-medium">{p.name}</span>
                            <div className="ml-auto flex -space-x-2">
                              {p.colors.map(c => <div key={c} className="w-5 h-5 rounded-full border border-card" style={{ backgroundColor: c }}/>)}
                            </div>
                          </Label>
                        ))}
                      </RadioGroup>
                    </motion.div>
                  )}
                   {step >= 3 && selectedStyle && (
                     <motion.div key="step3" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
                        <Button variant="link" onClick={() => setStep(2)} className="p-0 h-auto mb-2 text-muted-foreground">Change Palette</Button>
                        <h3 className="font-bold text-lg mb-4 flex items-center"><PenLine className="mr-2 text-primary h-5 w-5" /> 3. Adjust Line Art</h3>
                        <div className="flex items-center gap-4 pt-2">
                          <span className="text-sm text-muted-foreground">Soft</span>
                          <Slider defaultValue={[50]} max={100} step={1} value={lineArtDetail} onValueChange={setLineArtDetail} />
                          <span className="text-sm text-muted-foreground">Bold</span>
                        </div>
                        <Button size="lg" className="mt-8 w-full" onClick={() => setStep(4)}>
                            Toonify!
                            <ArrowRight className="ml-2 h-5 w-5"/>
                        </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
