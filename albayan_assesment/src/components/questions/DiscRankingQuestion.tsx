import React from 'react';
import { Question } from '@/types/exam';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface DiscRankingQuestionProps {
  question: Question;
  response?: Record<string, number>;
  onChange: (response: Record<string, number>) => void;
}

export const DiscRankingQuestion: React.FC<DiscRankingQuestionProps> = ({
  question,
  response = {},
  onChange
}) => {
  const statements = question.discStatements || [];
  
  const handleRankChange = (statement: string, rank: number) => {
    const newResponse = { ...response };
    
    // Remove this rank from other statements
    Object.keys(newResponse).forEach(key => {
      if (newResponse[key] === rank && key !== statement) {
        delete newResponse[key];
      }
    });
    
    // Set new rank
    newResponse[statement] = rank;
    onChange(newResponse);
  };
  
  const getRankForStatement = (statement: string): number | null => {
    return response[statement] || null;
  };
  
  const isRankUsed = (rank: number, currentStatement: string): boolean => {
    return Object.keys(response).some(key => 
      key !== currentStatement && response[key] === rank
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium leading-relaxed">
        {question.question}
      </div>
      
      <Card className="p-6 bg-accent/20">
        <div className="text-sm text-muted-foreground mb-4">
          <strong>Instructions:</strong> Rank each statement from 1 (Most like you) to {statements.length} (Least like you). 
          Each number can only be used once.
        </div>
        
        <div className="space-y-4">
          {statements.map((statement, index) => {
            const currentRank = getRankForStatement(statement);
            
            return (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{statement}</p>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: statements.length }, (_, i) => i + 1).map(rank => {
                    const isSelected = currentRank === rank;
                    const isDisabled = isRankUsed(rank, statement) && !isSelected;
                    
                    return (
                      <button
                        key={rank}
                        onClick={() => handleRankChange(statement, rank)}
                        disabled={isDisabled}
                        className={`
                          w-8 h-8 rounded-full text-sm font-medium transition-colors
                          ${isSelected 
                            ? 'bg-primary text-primary-foreground' 
                            : isDisabled 
                            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : 'bg-background border border-border hover:bg-accent'
                          }
                        `}
                      >
                        {rank}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          Progress: {Object.keys(response).length} of {statements.length} statements ranked
        </div>
      </Card>
    </div>
  );
};