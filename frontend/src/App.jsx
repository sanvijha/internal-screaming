import { useEffect } from "react";
import Debate from "./components/Debate";

export default function App() {
  useEffect(() => {
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices();
    };
  }, []);

  return <Debate />;
}