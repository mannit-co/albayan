import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Question } from '@/types/exam';
import { MultipleChoiceSingle } from './MultipleChoiceSingle';
import { MultipleChoiceMultiple } from './MultipleChoiceMultiple';
import { EssayQuestion } from './EssayQuestion';

interface ImageBasedQuestionProps {
  question: Question;
  response?: any;
  onChange: (response: any) => void;
}

export const ImageBasedQuestion: React.FC<ImageBasedQuestionProps> = ({
  question,
  response,
  onChange
}) => {
  // Image-based questions can have different underlying types
  // We'll render the image prominently and then the appropriate question type below
  
  // Normalize image input into a displayable src
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined);
  const [imgError, setImgError] = useState<string | null>(null);
  const createdUrlRef = useRef<string | null>(null);

const imageSrc = useMemo(() => {
  const val: any = (question as any)?.image;
  if (!val) return undefined;

  // If already a string data URL or http(s) URL
  if (typeof val === 'string') {
    const s = val.trim();
    if (s.startsWith('data:') || s.startsWith('http://') || s.startsWith('https://')) {
      return s;
    }
    // Heuristic: looks like base64 (no spaces, typical base64 chars)
    const base64Regex = /^[A-Za-z0-9+/=\n\r]+$/;
    if (base64Regex.test(s)) {
      return `data:image/jpeg;base64,${s.replace(/\s/g, '')}`;
    }
    // Fallback: return as-is
    return s;
  }

  // If it's binary data (ArrayBuffer or TypedArray), create a blob URL
  const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && val instanceof ArrayBuffer;
  const isTypedArray = typeof Uint8Array !== 'undefined' && val instanceof Uint8Array;
  if (isArrayBuffer || isTypedArray) {
    const blob = new Blob([val as BlobPart], { type: 'image/jpeg' }); // Cast to BlobPart
    // Create object URL lazily, stored via state
    const url = URL.createObjectURL(blob);
    return url;
  }

  return undefined;
}, [question]);


  // Track and revoke blob URLs we create in this component
  useEffect(() => {
    // If the current imageSrc is a blob URL, store it for cleanup
    if (imageSrc && imageSrc.startsWith('blob:')) {
      setObjectUrl(imageSrc);
      createdUrlRef.current = imageSrc;
    } else {
      setObjectUrl(undefined);
    }
    // Reset error when src changes
    setImgError(null);
    if (imageSrc) {
      // Helpful debug log (first 64 chars only)
      try {
        // eslint-disable-next-line no-console
        console.debug('[ImageBasedQuestion] image src:', imageSrc.slice(0, 64));
      } catch {}
    }
    return () => {
      if (createdUrlRef.current) {
        URL.revokeObjectURL(createdUrlRef.current);
        createdUrlRef.current = null;
      }
    };
  }, [imageSrc]);

  const renderQuestionContent = () => {
    // Determine the underlying question type based on options or structure
    if (question.options && question.options.length > 0) {
      // Check if it's multiple select by looking at the response type or question structure
      if (Array.isArray(response) || question.question.toLowerCase().includes('select all')) {
        return (
          <MultipleChoiceMultiple
            question={{ ...question, question: '' }} // Empty question since we show it above
            response={response}
            onChange={onChange}
          />
        );
      } else {
        return (
          <MultipleChoiceSingle
            question={{ ...question, question: '' }} // Empty question since we show it above
            response={response}
            onChange={onChange}
          />
        );
      }
    } else {
      // If no options, treat as essay question
      return (
        <EssayQuestion
          question={{ ...question, question: '' }} // Empty question since we show it above
          response={response}
          onChange={onChange}
        />
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium leading-relaxed">
        {question.question}
      </div>
      
      <div className="text-sm text-muted-foreground">
        Study the image carefully and answer the question below:
      </div>
      
      {imageSrc && (
        <div className="my-6 text-center">
          <img 
            src={objectUrl ?? imageSrc} 
            alt="Question image" 
            className="max-w-full max-h-96 mx-auto rounded-lg border shadow-lg"
            onError={() => setImgError('Failed to load image. If you just fetched questions, clear cached data and try again.')}
          />
          {imgError && (
            <div className="mt-2 text-sm text-red-600">{imgError}</div>
          )}
        </div>
      )}
      {!imageSrc && (
        <div className="my-6 text-center text-sm text-muted-foreground">
          No image available for this question.
        </div>
      )}
      
      {renderQuestionContent()}
      
      <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 p-3 rounded-lg">
        <strong>Tip:</strong> Look carefully at all details in the image. 
        Consider labels, measurements, patterns, or any specific features that relate to the question.
      </div>
    </div>
  );
};