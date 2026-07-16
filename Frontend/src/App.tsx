import AppRouter from "./routes/AppRouter";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} containerStyle={{ zIndex: 999999 }} />
      <AppRouter />
    </>
  );
}
  
export default App;