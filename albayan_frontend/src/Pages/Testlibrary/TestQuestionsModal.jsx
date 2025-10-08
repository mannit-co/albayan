
import TestQuestionsImportModal from "../../components/TestQuestionsImportModal"; //  react-toastify must be configured in your App

const TestQuestionsModal = ({ onClose, onImport }) => {
  return (
    <TestQuestionsImportModal
      isOpen={true}
      onClose={onClose}
      onImport={onImport}
    />
  );
};

export default TestQuestionsModal;
