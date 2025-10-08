import React from 'react';
import { Question } from '@/types/exam';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MatchFollowingQuestionProps {
  question: Question;
  response?: Record<string, string>;
  onChange: (response: Record<string, string>) => void;
}

export const MatchFollowingQuestion: React.FC<MatchFollowingQuestionProps> = ({
  question,
  response = {},
  onChange
}) => {
  const leftItems = question.matchPairs?.map(pair => pair.left) || [];
  const rightItems = question.matchPairs?.map(pair => pair.right) || [];
  
  const handleMatch = (leftItem: string, rightItem: string) => {
    const newResponse = { ...response };
    
    // If "clear" is selected, remove the mapping
    if (rightItem === "__CLEAR__") {
      delete newResponse[leftItem];
      onChange(newResponse);
      return;
    }
    
    // Remove previous mapping for this right item
    Object.keys(newResponse).forEach(key => {
      if (newResponse[key] === rightItem) {
        delete newResponse[key];
      }
    });
    
    // Set new mapping
    if (rightItem) {
      newResponse[leftItem] = rightItem;
    }
    
    onChange(newResponse);
  };

  const getAvailableRightItems = (currentLeftItem: string) => {
    const usedItems = Object.entries(response)
      .filter(([left]) => left !== currentLeftItem)
      .map(([, right]) => right);
    
    return rightItems.filter(item => !usedItems.includes(item));
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium leading-relaxed">
        {question.question}
      </div>
      
      <div className="text-sm text-muted-foreground">
        Match items from Column A with Column B:
      </div>
      
      {question.imageUrl && (
        <div className="my-4">
          <img 
            src={question.imageUrl} 
            alt="Question image" 
            className="max-w-full h-auto rounded-lg border"
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-center p-3 bg-primary/10 rounded-lg">
            Column A
          </h3>
          <div className="space-y-3">
            {leftItems.map((item, index) => (
              <div key={index} className="p-3 bg-card border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {String.fromCharCode(65 + index)}. {/* A, B, C, etc. */}
                </div>
                <div>{item}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium text-center p-3 bg-secondary/10 rounded-lg">
            Column B
          </h3>
          <div className="space-y-3">
            {rightItems.map((item, index) => (
              <div key={index} className="p-3 bg-card border rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {index + 1}. {/* 1, 2, 3, etc. */}
                </div>
                <div>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium">Your Matches:</h3>
        <div className="space-y-3">
          {leftItems.map((leftItem, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-accent/30 rounded-lg">
              <div className="flex-1">
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {leftItem}
              </div>
              <div className="text-muted-foreground">→</div>
              <div className="flex-1">
                <Select
                  value={response[leftItem] || ""}
                  onValueChange={(value) => handleMatch(leftItem, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select match" />
                  </SelectTrigger>
                  <SelectContent>
                    {response[leftItem] && (
                      <SelectItem value="__CLEAR__">
                        <span className="text-muted-foreground">-- Clear selection --</span>
                      </SelectItem>
                    )}
                    {getAvailableRightItems(leftItem).map((rightItem, idx) => {
                      const originalIndex = rightItems.indexOf(rightItem);
                      return (
                        <SelectItem key={idx} value={rightItem}>
                          {originalIndex + 1}. {rightItem}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Progress: {Object.keys(response).length} of {leftItems.length} matches completed
      </div>
    </div>
  );
};