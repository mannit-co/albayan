import { useState, useCallback } from 'react';
import { Question, QuestionState, StatusCounts } from '@/types/exam';

export const useExamState = (questions: Question[]) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, any>>({});
  const [questionStatus, setQuestionStatus] = useState<Record<number, QuestionState>>(() => {
    const initial: Record<number, QuestionState> = {};
    questions.forEach((_, index) => {
      initial[index] = {
        visited: index === 0,
        answered: false,
        markedForReview: false
      };
    });
    return initial;
  });

  const saveResponse = useCallback((questionIndex: number, response: any) => {
    setResponses(prev => ({ ...prev, [questionIndex]: response }));
    setQuestionStatus(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        answered: response !== null && response !== undefined && response !== '',
        visited: true
      }
    }));
  }, []);

  const clearResponse = useCallback((questionIndex: number) => {
    setResponses(prev => {
      const newResponses = { ...prev };
      delete newResponses[questionIndex];
      return newResponses;
    });
    setQuestionStatus(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        answered: false
      }
    }));
  }, []);

  const markForReview = useCallback((questionIndex: number) => {
    setQuestionStatus(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        markedForReview: !prev[questionIndex].markedForReview,
        visited: true
      }
    }));
  }, []);

  const goToQuestion = useCallback((questionIndex: number) => {
    if (questionIndex >= 0 && questionIndex < questions.length) {
      setCurrentQuestionIndex(questionIndex);
      setQuestionStatus(prev => ({
        ...prev,
        [questionIndex]: {
          ...prev[questionIndex],
          visited: true
        }
      }));
    }
  }, [questions.length]);

  const getQuestionStatus = useCallback((questionIndex: number): string => {
    const status = questionStatus[questionIndex];
    if (!status?.visited) return 'not-visited';
    if (status.answered && status.markedForReview) return 'answered-marked';
    if (status.answered) return 'answered';
    if (status.markedForReview) return 'marked';
    return 'not-answered';
  }, [questionStatus]);

  const getStatusCounts = useCallback((): StatusCounts => {
    const counts = {
      total: questions.length,
      answered: 0,
      notAnswered: 0,
      markedForReview: 0,
      notVisited: 0
    };

    questions.forEach((_, index) => {
      const status = getQuestionStatus(index);
      switch (status) {
        case 'answered':
          counts.answered++;
          break;
        case 'answered-marked':
          counts.answered++;
          counts.markedForReview++;
          break;
        case 'marked':
          counts.markedForReview++;
          counts.notAnswered++;
          break;
        case 'not-answered':
          counts.notAnswered++;
          break;
        case 'not-visited':
          counts.notVisited++;
          break;
      }
    });

    return counts;
  }, [questions.length, getQuestionStatus]);

  return {
    currentQuestionIndex,
    responses,
    questionStatus,
    saveResponse,
    clearResponse,
    markForReview,
    goToQuestion,
    getQuestionStatus,
    getStatusCounts
  };
};