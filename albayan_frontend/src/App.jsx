import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "../src/components/Login/Login";
import Signup from "./components/SignUp/Signup";
import Forgotpassword from "./components/Forgotpassword/Forgotpassword";
import Dashboard from "./Pages/Dashboard";
import Layout from "./components/Layout/Layout";
import TestLibrary from "./Pages/Testlibrary/TestCreate"
import Candidates from "./Pages/Candidates/Candidates";
import Reports from "./Pages/Reports/Overview";
import Settings from "./Pages/Settings";
import { LanguageProvider } from "./contexts/LanguageContext";
import { UserProvider } from "./contexts/UserContext";
import TestPreview from "./Pages/Testlibrary/TestPreviewTabs/TestPreview";
import Profile from "./Pages/Profile";
import ChangePassword from "./Pages/ChangePassword";
import QuestionBank from "./Pages/QuestionBank.jsx/QuestionBank";
import AssessmentLibrary from "./Pages/AssessmentLibrary/AssessmentLibrary";

function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgotpassword" element={<Forgotpassword />} />

          {/* Protected Routes with Layout */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/test-library" element={<Layout><TestLibrary /></Layout>} />
          <Route path="/question-bank" element={<Layout><QuestionBank /></Layout>} />
          <Route path="/candidates" element={<Layout><Candidates /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/assessment-library" element={<Layout><AssessmentLibrary /></Layout>} />
          <Route path="/ChangePassword" element={<Layout><ChangePassword /></Layout>} />

          {/* Test Preview Route */}
          <Route path="/tests/:id" element={<Layout><TestPreview /></Layout>} />
        </Routes>
      </Router>
    </LanguageProvider>
    </UserProvider>
  );
}

export default App;
