// import React from 'react';
// import { Question } from '@/types/exam';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// import { Label } from '@/components/ui/label';
// import { Card } from '@/components/ui/card';

// interface DiscBehavioralQuestionProps {
//   question: Question;
//   response?: string;
//   onChange: (response: string) => void;
// }

// export const DiscBehavioralQuestion: React.FC<DiscBehavioralQuestionProps> = ({
//   question,
//   response = '',
//   onChange
// }) => {
//   const options = question.options || [];

//   return (
//     <div className="space-y-6">
//       <div className="text-lg font-medium leading-relaxed">
//         {question.question}
//       </div>
      
//       <Card className="p-6 bg-accent/20">
//         <div className="text-sm text-muted-foreground mb-6">
//           <strong>Instructions:</strong> Choose the option that best describes your typical behavior or preference.
//         </div>
        
//         <RadioGroup 
//           value={response} 
//           onValueChange={onChange}
//           className="space-y-4"
//         >
//        {options.map((option: any, index) => {
//   const value = typeof option === 'string' ? option : option.text; // ✅ normalize
//   return (
//     <div
//       key={index}
//       className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
//     >
//       <RadioGroupItem 
//         value={value}
//         id={`option-${index}`} 
//         className="mt-0.5 flex-shrink-0"
//       />
//       <Label 
//         htmlFor={`option-${index}`} 
//         className="text-sm leading-relaxed cursor-pointer flex-1"
//       >
//         {typeof option === 'string' ? option : `${option.text} (${option.trait} - ${option.subtrait})`}
//       </Label>
//     </div>
//   );
// })}

//         </RadioGroup>
        
//         {response && (
//           <div className="mt-4 p-3 bg-primary/10 rounded-lg">
//             <div className="text-sm text-primary font-medium">
//               Selected: {response}
//             </div>
//           </div>
//         )}
//       </Card>
//     </div>
//   );
// };


import React from 'react';
import { Question } from '@/types/exam';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface DiscBehavioralQuestionProps {
  question: Question;
  response?: string;
  onChange: (response: string) => void;
}

export const DiscBehavioralQuestion: React.FC<DiscBehavioralQuestionProps> = ({
  question,
  response = '',
  onChange
}) => {
  const options = question.options || [];

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div className="text-lg font-medium leading-relaxed">
        {question.question}
      </div>
      
      <Card className="p-6 bg-accent/20">
        {/* Instructions */}
        <div className="text-sm text-muted-foreground mb-6">
          <strong>Instructions:</strong> Choose the option that best describes your typical behavior or preference.
        </div>
        
        {/* Radio Options */}
        <RadioGroup 
          value={response} 
          onValueChange={onChange}
          className="space-y-4"
        >
          {options.map((option: any, index) => {
            // For display: show only option.text
            const displayText = typeof option === 'string' ? option : option.text;
            // For storing: include trait-subtrait
            const storeValue = typeof option === 'string' ? option : `${option.text} (${option.trait} - ${option.subtrait})`;

            return (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <RadioGroupItem 
                  value={storeValue} // ✅ store value with trait-subtrait
                  id={`option-${index}`} 
                  className="mt-0.5 flex-shrink-0"
                />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="text-sm leading-relaxed cursor-pointer flex-1"
                >
                  {displayText} {/* ✅ only display text */}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
        
        {/* Display selected */}
        {response && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <div className="text-sm text-primary font-medium">
              Selected: {response}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
  